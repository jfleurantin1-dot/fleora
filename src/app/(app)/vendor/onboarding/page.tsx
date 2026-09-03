import { createClient } from "@/lib/supabase/server";
import { requireVendor } from "@/lib/auth";
import { Badge, PageHeader } from "@/components/ui";
import { VendorForm } from "./form";
import type { Service } from "@/lib/types";

export default async function VendorOnboardingPage() {
  const { profile, vendor } = await requireVendor();
  const supabase = createClient();

  let categories: string[] = [];
  let services: Service[] = [];
  let photos: string[] = [];

  if (vendor) {
    const [{ data: cats }, { data: svc }, { data: pics }] = await Promise.all([
      supabase.from("vendor_categories").select("category").eq("vendor_id", vendor.id),
      supabase.from("services").select("*").eq("vendor_id", vendor.id),
      supabase.from("vendor_photos").select("url").eq("vendor_id", vendor.id).order("sort"),
    ]);
    categories = (cats ?? []).map((c) => c.category);
    services = svc ?? [];
    photos = (pics ?? []).map((p) => p.url);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={vendor ? "Your Fleora profile" : "Set up your vendor profile"}
        subtitle="This powers your matches, your public profile and your leads."
        action={
          vendor && (
            <Badge tone={vendor.status === "approved" ? "green" : "amber"}>{vendor.status}</Badge>
          )
        }
      />
      <VendorForm
        userId={profile.id}
        vendor={vendor}
        categories={categories}
        services={services}
        photos={photos}
      />
    </div>
  );
}
