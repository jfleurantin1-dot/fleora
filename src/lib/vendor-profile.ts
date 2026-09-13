import type { Vendor } from "@/lib/types";

export type VendorProfileCounts = {
  categories: number;
  photos: number;
  services: number;
  packages: number;
};

export type VendorProfileCheck = {
  key: string;
  label: string;
  detail: string;
  done: boolean;
};

export function vendorProfileChecks(vendor: Vendor, counts: VendorProfileCounts): VendorProfileCheck[] {
  return [
    { key: "description", label: "Business story", done: Boolean(vendor.description?.trim()), detail: "Describe your style and the clients you serve." },
    { key: "area", label: "Service area", done: Boolean(vendor.location?.trim() && vendor.service_radius_miles), detail: "Add your home base and travel radius." },
    { key: "events", label: "Event types", done: Boolean(vendor.event_types?.length), detail: "Show which celebrations are your best fit." },
    { key: "categories", label: "Primary specialty", done: Boolean(vendor.primary_category && counts.categories), detail: "Choose a main service and any specialties." },
    { key: "photos", label: "Portfolio", done: counts.photos >= 5, detail: `${Math.min(counts.photos, 5)} of 5 recommended photos added.` },
    { key: "services", label: "Services & pricing", done: counts.services >= 3, detail: `${Math.min(counts.services, 3)} of 3 recommended services added.` },
    { key: "packages", label: "Bookable package", done: counts.packages >= 1, detail: "Add at least one easy-to-understand package." },
    { key: "social", label: "Website or Instagram", done: Boolean(vendor.website || vendor.instagram), detail: "Give clients another place to see your work." },
    { key: "contact", label: "Public contact", done: Boolean(vendor.contact_email || vendor.contact_phone), detail: "Add a business email or phone number." },
    { key: "booking", label: "Booking details", done: Boolean(vendor.booking_lead_time && (vendor.deposit_policy || vendor.cancellation_policy)), detail: "Set expectations for timing and policies." },
  ];
}

export function vendorProfileCompletion(vendor: Vendor, counts: VendorProfileCounts) {
  const checks = vendorProfileChecks(vendor, counts);
  const complete = checks.filter((check) => check.done).length;
  return { checks, complete, percentage: Math.round((complete / checks.length) * 100) };
}
