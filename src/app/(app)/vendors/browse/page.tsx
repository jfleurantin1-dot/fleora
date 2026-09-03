import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, Card, Empty, PageHeader, Stars } from "@/components/ui";
import { CATEGORY_GROUPS, categoriesInGroup, GROUP_MAP, categoryLabel } from "@/lib/constants";
import { ChevronRightIcon, MapPinIcon, SearchIcon } from "@/components/icons";
import { money } from "@/lib/format";

export default async function BrowseVendors({ searchParams }: { searchParams: { group?: string } }) {
  await requireProfile();
  const supabase = createClient();
  const group = searchParams.group && GROUP_MAP[searchParams.group] ? searchParams.group : undefined;

  let vendorIds: string[] | null = null;
  if (group) {
    const leafKeys = categoriesInGroup(group).map((c) => c.key);
    const { data } = await supabase.from("vendor_categories").select("vendor_id").in("category", leafKeys);
    vendorIds = [...new Set((data ?? []).map((r) => r.vendor_id))];
  }

  let query = supabase.from("vendors").select("*").eq("status", "approved").order("rating", { ascending: false });
  if (vendorIds) query = query.in("id", vendorIds.length ? vendorIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: vendors } = await query;
  const ids = (vendors ?? []).map((v) => v.id);
  const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: photos }, { data: cats }, { data: services }] = await Promise.all([
    supabase.from("vendor_photos").select("vendor_id,url,sort").in("vendor_id", safeIds).order("sort"),
    supabase.from("vendor_categories").select("vendor_id,category").in("vendor_id", safeIds),
    supabase.from("services").select("vendor_id,starting_price").in("vendor_id", safeIds),
  ]);

  const heroPhoto = new Map<string, string>();
  for (const p of photos ?? []) if (!heroPhoto.has(p.vendor_id)) heroPhoto.set(p.vendor_id, p.url);

  const categories = new Map<string, string[]>();
  for (const c of cats ?? []) categories.set(c.vendor_id, [...(categories.get(c.vendor_id) ?? []), c.category]);

  const startingPrice = new Map<string, number>();
  for (const s of services ?? []) {
    if (s.starting_price == null) continue;
    const current = startingPrice.get(s.vendor_id);
    const value = Number(s.starting_price);
    if (current == null || value < current) startingPrice.set(s.vendor_id, value);
  }

  return (
    <div>
      <PageHeader title="Discover vendors" subtitle="Find trusted businesses for every part of your celebration." />

      <div className="mb-6 rounded-[22px] border border-[#E9E3E7] bg-white p-3 shadow-fleora">
        <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-ivory-50 px-4 text-ink-500">
          <SearchIcon size={19} />
          <span className="text-sm">Browse by service below — search is coming next.</span>
        </div>
      </div>

      <div className="scroll-thin -mx-1 mb-7 flex gap-2 overflow-x-auto px-1 pb-2">
        <Link href="/vendors/browse" className={`fleora-chip shrink-0 ${!group ? "fleora-chip-active" : ""}`}>All vendors</Link>
        {CATEGORY_GROUPS.map((g) => (
          <Link key={g.key} href={`/vendors/browse?group=${g.key}`} className={`fleora-chip shrink-0 ${group === g.key ? "fleora-chip-active" : ""}`}>{g.label}</Link>
        ))}
      </div>

      {!vendors || vendors.length === 0 ? (
        <Empty title="No vendors in this category yet"><p>Fleora is growing the marketplace. Try another category for now.</p></Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => {
            const photo = heroPhoto.get(v.id);
            const vendorCats = (categories.get(v.id) ?? []).slice(0, 3);
            const price = startingPrice.get(v.id);
            return (
              <Card as="li" key={v.id} variant="interactive" padding="none" className="overflow-hidden">
                <Link href={`/vendors/${v.id}`} className="block h-full">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blush-100 to-plum-100">
                    {photo ? (
                      <Image src={photo} alt={v.business_name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center font-display text-5xl text-plum-300">F</div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {v.verified && <Badge tone="plum">Verified</Badge>}
                      {Number(v.rating) >= 4.8 && <Badge tone="champagne">Top rated</Badge>}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-2xl text-ink-900">{v.business_name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-ink-500"><MapPinIcon size={13} />{v.location ?? "Greater Boston"}</p>
                      </div>
                      <ChevronRightIcon size={18} className="mt-1 shrink-0 text-ink-400" />
                    </div>

                    <div className="mt-3"><Stars rating={v.rating} count={v.review_count} /></div>
                    {v.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-600">{v.description}</p>}

                    {vendorCats.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {vendorCats.map((c) => <Badge key={c} tone="slate">{categoryLabel(c)}</Badge>)}
                      </div>
                    )}

                    <div className="mt-5 flex items-end justify-between border-t fleora-divider pt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Starting at</p>
                        <p className="mt-0.5 font-semibold text-ink-900">{price != null ? money(price) : "Request pricing"}</p>
                      </div>
                      <span className="text-xs font-bold text-plum-700">View vendor</span>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
