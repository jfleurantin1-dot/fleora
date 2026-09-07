"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { sendFleoraEmail } from "@/lib/email";
import { notifyFleoraAdmins } from "@/lib/admin-notifications";

export type ClaimState = { ok?: boolean; error?: string };

export async function requestVendorClaim(
  vendorId: string,
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const profile = await requireProfile(`/vendors/${vendorId}`);
  if (profile.account_type !== "vendor" && profile.account_type !== "admin") {
    return { error: "Create or switch to a vendor account before claiming a business profile." };
  }

  const supabase = createClient();
  const { data: vendor } = await supabase.from("vendors").select("id,user_id,business_name").eq("id", vendorId).single();
  if (!vendor) return { error: "Vendor profile not found." };
  if (vendor.user_id) return { error: "This business profile has already been claimed." };

  const note = String(formData.get("note") ?? "").trim() || null;
  const { error } = await supabase.from("vendor_claims").upsert(
    {
      vendor_id: vendorId,
      claimant_id: profile.id,
      note,
      status: "pending",
      reviewed_at: null,
    },
    { onConflict: "vendor_id,claimant_id" },
  );
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: profile.id,
    kind: "vendor_claim",
    title: "Business claim submitted",
    body: `Your claim for ${vendor.business_name} is awaiting Fleora review. We’ll notify you when a decision is made.`,
    href: `/vendors/${vendorId}`,
  });

  await notifyFleoraAdmins({
    title: "Business claim awaiting approval",
    body: `${profile.first_name ?? "A vendor"}${profile.last_name ? ` ${profile.last_name}` : ""} submitted a claim for ${vendor.business_name}.`,
    href: "/admin#claim-requests",
    emailSubject: `Business claim awaiting approval: ${vendor.business_name}`,
    emailHeading: "A business claim needs your review",
    emailBody: `${profile.first_name ?? "A vendor"}${profile.last_name ? ` ${profile.last_name}` : ""} submitted a claim for ${vendor.business_name}. Review the claim in Fleora Admin.`,
    emailCtaLabel: "Review business claim",
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    await sendFleoraEmail({
      to: user.email,
      subject: `We received your claim for ${vendor.business_name}`,
      heading: "Your business claim is under review",
      body: `We received your request to claim ${vendor.business_name}. Fleora will review the request and notify you as soon as it’s approved or declined.`,
      ctaLabel: "View business profile",
      ctaHref: `/vendors/${vendorId}`,
    });
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/admin");
  return { ok: true };
}
