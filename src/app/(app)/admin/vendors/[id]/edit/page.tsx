import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { CategoryIcon } from "@/components/category-icon";
import { CATEGORY_GROUPS, categoriesInGroup } from "@/lib/constants";
import { PhotoUploader } from "@/components/vendor/photo-uploader";
import { updateDirectoryVendor } from "../../../actions";
import { CopyClaimLink } from "../../../copy-claim-link";

export default async function EditAdminVendorPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile(`/admin/vendors/${params.id}/edit`);
  if (profile.account_type !== "admin") redirect("/dashboard");
  const supabase = createClient();
  const [{ data: vendor }, { data: cats }, { data: photos }] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", params.id).single(),
    supabase.from("vendor_categories").select("category").eq("vendor_id", params.id),
    supabase.from("vendor_photos").select("url,sort").eq("vendor_id", params.id).order("sort"),
  ]);
  if (!vendor) notFound();
  const selected = new Set((cats ?? []).map((x) => x.category));
  const action = updateDirectoryVendor.bind(null, params.id);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="fleora-kicker">Admin vendor management</p><h1 className="font-display text-3xl text-ink-900">Edit {vendor.business_name}</h1><p className="mt-1 text-sm text-ink-500">Update the public storefront, services, contact details, and photos.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin" className="inline-flex min-h-10 items-center rounded-xl border border-plum-200 bg-white px-3 text-sm font-semibold text-plum-700">← Admin</Link>{!vendor.user_id && <CopyClaimLink vendorId={vendor.id} />}<Link href={`/vendors/${vendor.id}`} className="inline-flex min-h-10 items-center rounded-xl border border-plum-200 bg-white px-3 text-sm font-semibold text-plum-700">View profile</Link></div>
    </div>
    <form action={action}>
      <Card variant="feature" padding="lg" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Business name"><Input name="business_name" required defaultValue={vendor.business_name} /></Field><Field label="Location"><Input name="location" defaultValue={vendor.location ?? ""} /></Field></div>
        <Field label="Description"><Textarea name="description" rows={4} defaultValue={vendor.description ?? ""} /></Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Website"><Input name="website" type="url" defaultValue={vendor.website ?? ""} /></Field><Field label="Instagram"><Input name="instagram" defaultValue={vendor.instagram ?? ""} /></Field><Field label="Public email"><Input name="contact_email" type="email" defaultValue={vendor.contact_email ?? ""} /></Field><Field label="Phone"><Input name="contact_phone" type="tel" defaultValue={vendor.contact_phone ?? ""} /></Field></div>
        <Field label="Service radius (miles)"><Input name="service_radius_miles" type="number" min={5} max={150} defaultValue={vendor.service_radius_miles ?? 25} /></Field>
        <div><p className="mb-2 text-sm font-semibold text-ink-900">Categories</p><div className="space-y-4">{CATEGORY_GROUPS.map((group) => <div key={group.key}><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-plum-500">{group.label}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{categoriesInGroup(group.key).map((category) => <label key={category.key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E9E3E7] bg-white px-3 py-2.5 text-sm text-ink-700"><input name="category" value={category.key} type="checkbox" defaultChecked={selected.has(category.key)} className="h-4 w-4 rounded border-plum-300 text-plum-600"/><span className="inline-flex items-center gap-2"><CategoryIcon category={category.key} size={22}/>{category.label}</span></label>)}</div></div>)}</div></div>
        <div><p className="mb-2 text-sm font-semibold text-ink-900">Business photos</p><p className="mb-3 text-xs text-ink-500">Upload, remove, and drag photos into the order you want. The first photo is the storefront cover.</p><PhotoUploader userId={profile.id} initial={(photos ?? []).map((x) => x.url)} /></div>
        <Button type="submit">Save business changes</Button>
      </Card>
    </form>
  </div>;
}
