import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Badge, Stars, PageHeader } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";

export default async function VendorProfile({ params }: { params: { id: string } }) {
  await requireProfile();
  const supabase = createClient();

  const { data: vendor } = await supabase.from("vendors").select("*").eq("id", params.id).single();
  if (!vendor) notFound();

  const [{ data: cats }, { data: photos }, { data: services }, { data: packages }, { data: reviews }] =
    await Promise.all([
      supabase.from("vendor_categories").select("category").eq("vendor_id", params.id),
      supabase.from("vendor_photos").select("*").eq("vendor_id", params.id).order("sort"),
      supabase.from("services").select("*").eq("vendor_id", params.id),
      supabase.from("packages").select("*").eq("vendor_id", params.id),
      supabase
        .from("reviews")
        .select("*")
        .eq("vendor_id", params.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={vendor.business_name} subtitle={vendor.location ?? undefined} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Stars rating={vendor.rating} count={vendor.review_count} />
        {vendor.verified && <Badge tone="plum">Verified</Badge>}
        <Badge tone={vendor.status === "approved" ? "green" : "amber"}>{vendor.status}</Badge>
        <span className="text-sm text-slate-400">{vendor.response_rate}% response rate</span>
      </div>

      {photos && photos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-plum-100">
              <Image src={p.url} alt="" fill sizes="300px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {vendor.description && (
        <Card className="mb-6">
          <p className="text-sm leading-relaxed text-slate-600">{vendor.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(cats ?? []).map((c) => (
              <Badge key={c.category} tone="slate">
                {categoryLabel(c.category)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Services</h2>
          <ul className="space-y-2">
            {(services ?? []).map((s) => (
              <Card as="li" key={s.id}>
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-600">from {money(s.starting_price)}</p>
                </div>
                {s.description && <p className="mt-1 text-xs text-slate-500">{s.description}</p>}
              </Card>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Packages</h2>
          {packages && packages.length > 0 ? (
            <ul className="space-y-2">
              {packages.map((p) => (
                <Card as="li" key={p.id}>
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-sm font-semibold text-plum-700">{money(p.price)}</p>
                  </div>
                  {p.description && <p className="mt-1 text-xs text-slate-500">{p.description}</p>}
                </Card>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No packages listed.</p>
          )}
        </section>
      </div>

      {reviews && reviews.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Reviews</h2>
          <ul className="space-y-2">
            {reviews.map((r) => (
              <Card as="li" key={r.id}>
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-slate-400">{shortDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
              </Card>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-sm text-slate-500">
        To contact {vendor.business_name}, open one of your events and request a quote for the
        service you need.
      </p>
    </div>
  );
}
