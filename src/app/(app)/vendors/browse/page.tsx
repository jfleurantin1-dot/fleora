import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Badge, Stars, PageHeader, Empty } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";

export default async function BrowseVendors({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  await requireProfile();
  const supabase = createClient();

  const category = searchParams.category;

  let vendorIds: string[] | null = null;
  if (category) {
    const { data } = await supabase
      .from("vendor_categories")
      .select("vendor_id")
      .eq("category", category);
    vendorIds = (data ?? []).map((r) => r.vendor_id);
  }

  let query = supabase
    .from("vendors")
    .select("*")
    .eq("status", "approved")
    .order("rating", { ascending: false });
  if (vendorIds) query = query.in("id", vendorIds.length ? vendorIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: vendors } = await query;

  return (
    <div>
      <PageHeader title="Browse vendors" subtitle="Every approved vendor on Fleora." />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/vendors/browse"
          className={`rounded-full px-3 py-1 text-sm ${
            !category ? "bg-plum-600 text-white" : "bg-white text-slate-600 ring-1 ring-plum-200"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/vendors/browse?category=${c.key}`}
            className={`rounded-full px-3 py-1 text-sm ${
              category === c.key
                ? "bg-plum-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-plum-200"
            }`}
          >
            {c.emoji} {c.label}
          </Link>
        ))}
      </div>

      {!vendors || vendors.length === 0 ? (
        <Empty title="No vendors in this category yet" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <Card as="li" key={v.id} className="transition hover:ring-plum-200">
              <Link href={`/vendors/${v.id}`} className="block space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{v.business_name}</h3>
                  {v.verified && <Badge tone="plum">Verified</Badge>}
                </div>
                <p className="text-sm text-slate-500">{v.location}</p>
                <Stars rating={v.rating} count={v.review_count} />
                {v.description && (
                  <p className="line-clamp-2 text-sm text-slate-600">{v.description}</p>
                )}
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
