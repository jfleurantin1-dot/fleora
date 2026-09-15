"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geocodeZip, normalizeUsZip } from "@/lib/geo";

export type VendorOnboardingState = { error?: string; ok?: boolean };

function normalizeWebsite(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function normalizeInstagram(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "").replace(/^instagram\.com\//i, "").replace(/\/$/, "");
  return `https://instagram.com/${handle}`;
}

export async function saveVendorProfile(
  _prev: VendorOnboardingState,
  formData: FormData,
): Promise<VendorOnboardingState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const businessName = String(formData.get("business_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const rawPostalCode = String(formData.get("postal_code") ?? "").trim();
  const postalCode = rawPostalCode ? normalizeUsZip(rawPostalCode) : null;
  const radius = Number(formData.get("service_radius_miles")) || 25;
  const website = normalizeWebsite(String(formData.get("website") ?? ""));
  const instagram = normalizeInstagram(String(formData.get("instagram") ?? ""));
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;
  const categories = formData.getAll("category").map(String);
  const requestedPrimaryCategory = String(formData.get("primary_category") ?? "").trim();
  const primaryCategory = categories.includes(requestedPrimaryCategory) ? requestedPrimaryCategory : categories[0] ?? null;
  const eventTypes = formData.getAll("event_type").map(String);
  const profileDetails = {
    primary_category: primaryCategory,
    event_types: eventTypes,
    booking_lead_time: String(formData.get("booking_lead_time") ?? "").trim() || null,
    availability_notes: String(formData.get("availability_notes") ?? "").trim() || null,
    setup_delivery_notes: String(formData.get("setup_delivery_notes") ?? "").trim() || null,
    dietary_accommodations: String(formData.get("dietary_accommodations") ?? "").trim() || null,
    accessibility_notes: String(formData.get("accessibility_notes") ?? "").trim() || null,
    deposit_policy: String(formData.get("deposit_policy") ?? "").trim() || null,
    cancellation_policy: String(formData.get("cancellation_policy") ?? "").trim() || null,
    travel_fee_policy: String(formData.get("travel_fee_policy") ?? "").trim() || null,
    faqs: Array.from({ length: 6 }, (_, i) => ({
      question: String(formData.get(`faq_question_${i}`) ?? "").trim(),
      answer: String(formData.get(`faq_answer_${i}`) ?? "").trim(),
    })).filter((faq) => faq.question && faq.answer),
  };

  if (!businessName) return { error: "Enter your business name." };
  if (categories.length === 0) return { error: "Pick at least one service category." };
  if (rawPostalCode && !postalCode) return { error: "Enter a valid 5-digit ZIP code." };

  const { data: existing } = await supabase
    .from("vendors")
    .select("id,location,postal_code,latitude,longitude")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing && !postalCode) return { error: "Enter the ZIP code for your service location." };
  const geocoded = postalCode ? await geocodeZip(postalCode) : null;
  const location = postalCode ? (geocoded?.label ?? postalCode) : (existing?.location ?? null);
  const savedPostalCode = postalCode ?? existing?.postal_code ?? null;
  const latitude = geocoded?.lat ?? existing?.latitude ?? null;
  const longitude = geocoded?.lng ?? existing?.longitude ?? null;

  let vendorId = existing?.id;

  if (vendorId) {
    await supabase
      .from("vendors")
      .update({
        business_name: businessName,
        description,
        location,
        postal_code: savedPostalCode,
        latitude,
        longitude,
        service_radius_miles: radius,
        website,
        instagram,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        ...profileDetails,
      })
      .eq("id", vendorId);
  } else {
    const { data: created, error } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        business_name: businessName,
        description,
        location,
        postal_code: savedPostalCode,
        latitude,
        longitude,
        service_radius_miles: radius,
        website,
        instagram,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        ...profileDetails,
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !created) return { error: error?.message ?? "Could not save your profile." };
    vendorId = created.id;
  }

  // Replace categories.
  await supabase.from("vendor_categories").delete().eq("vendor_id", vendorId);
  await supabase
    .from("vendor_categories")
    .insert(categories.map((category) => ({ vendor_id: vendorId!, category })));

  // Replace services (up to 4 rows from the form).
  await supabase.from("services").delete().eq("vendor_id", vendorId);
  const svc: { vendor_id: string; category: string; name: string; description: string | null; starting_price: number | null }[] = [];
  for (let i = 0; i < 12; i++) {
    const name = String(formData.get(`svc_name_${i}`) ?? "").trim();
    const category = String(formData.get(`svc_cat_${i}`) ?? "").trim();
    const description = String(formData.get(`svc_desc_${i}`) ?? "").trim() || null;
    const price = Number(formData.get(`svc_price_${i}`)) || null;
    if (name && category) svc.push({ vendor_id: vendorId, category, name, description, starting_price: price });
  }
  if (svc.length) await supabase.from("services").insert(svc);

  // Replace storefront packages (up to 3 rows from the form).
  await supabase.from("packages").delete().eq("vendor_id", vendorId);
  const pkgs: { vendor_id: string; name: string; description: string | null; price: number | null }[] = [];
  for (let i = 0; i < 12; i++) {
    const name = String(formData.get(`pkg_name_${i}`) ?? "").trim();
    const description = String(formData.get(`pkg_desc_${i}`) ?? "").trim() || null;
    const price = Number(formData.get(`pkg_price_${i}`)) || null;
    if (name) pkgs.push({ vendor_id: vendorId, name, description, price });
  }
  if (pkgs.length) await supabase.from("packages").insert(pkgs);

  // Replace photos (newline / comma separated URLs).
  const photoRaw = String(formData.get("photos") ?? "");
  const urls = photoRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));
  await supabase.from("vendor_photos").delete().eq("vendor_id", vendorId);
  if (urls.length) {
    await supabase
      .from("vendor_photos")
      .insert(urls.map((url, sort) => ({ vendor_id: vendorId!, url, sort })));
  }

  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/onboarding");
  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}
