"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendFleoraEmail } from "@/lib/email";
import { getProfile } from "@/lib/auth";
import type { VendorStatus } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { geocodeMa } from "@/lib/geo";

async function assertAdmin() {
  const profile = await getProfile();
  if (!profile || profile.account_type !== "admin") throw new Error("Not authorized");
  return profile;
}

export async function moderateVendor(vendorId: string, action: "suspended" | "deleted", rawReason: string): Promise<{ ok?: boolean; error?: string }> {
  const admin = await assertAdmin();
  const reason = rawReason.trim();
  if (reason.length < 5) return { error: "A reason of at least 5 characters is required." };

  const supabase = createClient();
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id,user_id,business_name,status,location,contact_email,contact_phone")
    .eq("id", vendorId)
    .single();
  if (vendorError || !vendor) return { error: vendorError?.message ?? "Vendor not found." };

  const { error: logError } = await supabase.from("vendor_admin_actions").insert({
    vendor_id: vendorId,
    vendor_user_id: vendor.user_id,
    business_name_snapshot: vendor.business_name,
    previous_status: vendor.status,
    action,
    reason,
    admin_id: admin.id,
    vendor_snapshot: vendor,
  });
  if (logError) return { error: logError.message };

  const { error: updateError } = await supabase.from("vendors").update({ status: action }).eq("id", vendorId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/admin");
  revalidatePath("/admin/deleted-vendors");
  revalidatePath("/vendors/browse");
  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendor/dashboard");
  return { ok: true };
}

export async function setVendorStatus(vendorId: string, status: Extract<VendorStatus, "pending" | "approved">) {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from("vendors").update({ status }).eq("id", vendorId);
  revalidatePath("/admin");
  revalidatePath(`/vendors/${vendorId}`);
}

export type AdminVendorState = { ok?: boolean; error?: string; vendorId?: string };

export async function createDirectoryVendor(
  _prev: AdminVendorState,
  formData: FormData,
): Promise<AdminVendorState> {
  await assertAdmin();
  const supabase = createClient();

  const businessName = String(formData.get("business_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;
  const radius = Math.min(150, Math.max(5, Number(formData.get("service_radius_miles")) || 25));
  const startingPrice = Number(formData.get("starting_price")) || null;
  const selected = new Set(formData.getAll("category").map(String));
  const validKeys = new Set(CATEGORIES.map((c) => c.key));
  const categories = [...selected].filter((c) => validKeys.has(c as never));

  if (!businessName) return { error: "Enter the vendor's business name." };
  if (categories.length === 0) return { error: "Choose at least one service category." };

  const coords = location ? geocodeMa(location) : null;
  const { data: vendor, error } = await supabase
    .from("vendors")
    .insert({
      user_id: null,
      business_name: businessName,
      description,
      location,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      service_radius_miles: radius,
      website,
      instagram,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      source: "admin",
      status: "approved",
    })
    .select("id")
    .single();

  if (error || !vendor) return { error: error?.message ?? "Could not create vendor." };

  const vendorId = String(vendor.id);
  const { error: catError } = await supabase
    .from("vendor_categories")
    .insert(categories.map((category) => ({ vendor_id: vendorId, category })));
  if (catError) return { error: catError.message };

  if (startingPrice != null) {
    const primary = categories[0];
    await supabase.from("services").insert({
      vendor_id: vendorId,
      category: primary,
      name: "Services",
      starting_price: startingPrice,
    });
  }

  const photoRaw = String(formData.get("photos") ?? "");
  const allPhotos = photoRaw.split("\n").map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
  if (allPhotos.length) {
    await supabase.from("vendor_photos").insert(allPhotos.map((url, sort) => ({ vendor_id: vendorId, url, sort })));
  }

  revalidatePath("/admin");
  revalidatePath("/vendors/browse");
  return { ok: true, vendorId };
}

export async function reviewVendorClaim(
  claimId: string,
  vendorId: string,
  claimantId: string,
  decision: "approved" | "rejected",
) {
  await assertAdmin();
  const supabase = createClient();

  if (decision === "approved") {
    const { data: vendor } = await supabase.from("vendors").select("user_id").eq("id", vendorId).single();
    if (vendor?.user_id && vendor.user_id !== claimantId) throw new Error("This profile is already claimed.");

    const { error: vendorError } = await supabase
      .from("vendors")
      .update({ user_id: claimantId, source: "claimed" })
      .eq("id", vendorId)
      .is("user_id", null);
    if (vendorError) throw new Error(vendorError.message);

    await supabase.from("profiles").update({ account_type: "vendor" }).eq("id", claimantId);
  }

  const { error } = await supabase
    .from("vendor_claims")
    .update({ status: decision, reviewed_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  const { data: vendorDetails } = await admin
    .from("vendors")
    .select("business_name")
    .eq("id", vendorId)
    .single();
  const businessName = String(vendorDetails?.business_name ?? "your business");
  const approved = decision === "approved";

  await admin.from("notifications").insert({
    user_id: claimantId,
    kind: "vendor_claim",
    title: approved ? "Your business profile is approved 🎉" : "Update on your business claim",
    body: approved
      ? `${businessName} is now claimed by your Fleora account. You can edit your profile and start receiving inquiries.`
      : `Your claim for ${businessName} wasn’t approved. You can review the listing or contact Fleora if you believe this was a mistake.`,
    href: approved ? "/vendor/dashboard" : `/vendors/${vendorId}`,
  });

  try {
    const { data: authData } = await admin.auth.admin.getUserById(claimantId);
    const claimantEmail = authData.user?.email;
    if (claimantEmail) {
      await sendFleoraEmail({
        to: claimantEmail,
        subject: approved
          ? `${businessName} has been approved on Fleora`
          : `Update on your Fleora claim for ${businessName}`,
        heading: approved ? "Your Fleora business profile is approved 🎉" : "Your business claim was not approved",
        body: approved
          ? `${businessName} is now connected to your Fleora vendor account. You can edit your profile, manage availability, and receive client inquiries.`
          : `We weren’t able to approve your claim for ${businessName}. If you believe this decision was made in error, you can review the business listing and contact Fleora for help.`,
        ctaLabel: approved ? "Go to vendor dashboard" : "View business listing",
        ctaHref: approved ? "/vendor/dashboard" : `/vendors/${vendorId}`,
      });
    }
  } catch (emailError) {
    console.error("Could not send vendor claim decision email", emailError);
  }

  revalidatePath("/notifications");
  revalidatePath("/admin");
  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendor/dashboard");
}


export async function updateDirectoryVendor(vendorId: string, formData: FormData) {
  await assertAdmin();
  const supabase = createClient();
  const businessName = String(formData.get("business_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;
  const radius = Math.min(150, Math.max(5, Number(formData.get("service_radius_miles")) || 25));
  const selected = new Set(formData.getAll("category").map(String));
  const validKeys = new Set(CATEGORIES.map((c) => c.key));
  const categories = [...selected].filter((c) => validKeys.has(c as never));
  if (!businessName) throw new Error("Enter the vendor's business name.");
  if (!categories.length) throw new Error("Choose at least one service category.");
  const coords = location ? geocodeMa(location) : null;
  const { error } = await supabase.from("vendors").update({
    business_name: businessName, description, location, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
    service_radius_miles: radius, website, instagram, contact_email: contactEmail, contact_phone: contactPhone,
  }).eq("id", vendorId);
  if (error) throw new Error(error.message);

  await supabase.from("vendor_categories").delete().eq("vendor_id", vendorId);
  const { error: catError } = await supabase.from("vendor_categories").insert(categories.map((category) => ({ vendor_id: vendorId, category })));
  if (catError) throw new Error(catError.message);

  const urls = String(formData.get("photos") ?? "").split("\n").map((x) => x.trim()).filter((x) => /^https?:\/\//i.test(x));
  await supabase.from("vendor_photos").delete().eq("vendor_id", vendorId);
  if (urls.length) {
    const { error: photoError } = await supabase.from("vendor_photos").insert(urls.map((url, sort) => ({ vendor_id: vendorId, url, sort })));
    if (photoError) throw new Error(photoError.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/vendors/${vendorId}/edit`);
  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors/browse");
}
