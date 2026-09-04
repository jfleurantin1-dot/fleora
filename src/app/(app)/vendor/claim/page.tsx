import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { categoryLabel } from "@/lib/constants";
import { MapPinIcon, SearchIcon } from "@/components/icons";

export default async function ClaimBusinessPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const profile = await requireProfile("/vendor/claim");
  if (profile.account_type !== "vendor" && profile.account_type !== "admin") redirect("/dashboard");

  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();

  const [{ data: vendors }, { data: myClaims }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id,business_name,location,description,instagram,website,status,user_id")
      .is("user_id", null)
      .eq("status", "approved")
      .order("business_name")
      .limit(100),
    supabase
      .from("vendor_claims")
      .select("vendor_id,status")
      .eq("claimant_id", profile.id),
  ]);

  const rows = vendors ?? [];
  const filtered = q
    ? rows.filter((vendor) => {
        const haystack = [vendor.business_name, vendor.location, vendor.instagram, vendor.website]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : rows;

  const ids = filtered.map((vendor) => vendor.id);
  const { data: categories } = ids.length
    ? await supabase.from("vendor_categories").select("vendor_id,category").in("vendor_id", ids)
    : { data: [] as { vendor_id: string; category: string }[] };

  const categoryMap = new Map<string, string[]>();
  for (const row of categories ?? []) {
    categoryMap.set(row.vendor_id, [...(categoryMap.get(row.vendor_id) ?? []), row.category]);
  }
  const claimMap = new Map((myClaims ?? []).map((claim) => [claim.vendor_id, claim.status]));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Find & claim your business"
        subtitle="Search Fleora’s complimentary listings. If you find your business, open the profile and send a claim request for admin review."
      />

      <Card variant="feature" className="mb-6">
        <form method="get" className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-[#E9E3E7] bg-white px-4 shadow-sm focus-within:border-plum-300 focus-within:ring-4 focus-within:ring-plum-50">
            <SearchIcon size={19} className="shrink-0 text-ink-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Business name, city, Instagram…"
              className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </label>
          <button className="min-h-12 rounded-xl bg-plum-500 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-plum-600">
            Search
          </button>
        </form>
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          Tip: try just the main part of your business name if you don’t see it right away.
        </p>
      </Card>

      {q && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-600">
            <span className="font-semibold text-ink-900">{filtered.length}</span> result{filtered.length === 1 ? "" : "s"} for “{q}”
          </p>
          <Link href="/vendor/claim" className="text-sm font-semibold text-plum-700">Clear search</Link>
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty title={q ? "We couldn’t find that business" : "No unclaimed listings yet"}>
          <div className="space-y-3">
            <p>{q ? "Try a shorter business name or search by city. If it still isn’t here, you can create your own vendor profile." : "There are no unclaimed profiles available to claim right now."}</p>
            <ButtonLink href="/vendor/onboarding" variant="secondary" size="sm">Create my profile instead</ButtonLink>
          </div>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((vendor) => {
            const cats = (categoryMap.get(vendor.id) ?? []).slice(0, 3);
            const claimStatus = claimMap.get(vendor.id);
            return (
              <Card as="li" key={vendor.id} variant="interactive" className="flex h-full flex-col justify-between gap-5">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge tone="champagne">Unclaimed</Badge>
                    {claimStatus === "pending" && <Badge tone="amber">Claim pending</Badge>}
                    {claimStatus === "rejected" && <Badge tone="rose">Previous claim not approved</Badge>}
                  </div>
                  <h2 className="font-display text-2xl text-ink-900">{vendor.business_name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-500"><MapPinIcon size={14} />{vendor.location ?? "Greater Boston"}</p>
                  {vendor.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-600">{vendor.description}</p>}
                  {cats.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{cats.map((cat) => <Badge key={cat} tone="slate">{categoryLabel(cat)}</Badge>)}</div>}
                  {vendor.instagram && <p className="mt-3 text-xs font-medium text-plum-700">{vendor.instagram}</p>}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t fleora-divider pt-4">
                  <p className="text-xs text-ink-500">{claimStatus === "pending" ? "Your request is awaiting admin review." : "Open this listing to confirm it’s yours."}</p>
                  <ButtonLink href={`/vendors/${vendor.id}`} size="sm" variant={claimStatus === "pending" ? "secondary" : "primary"}>
                    {claimStatus === "pending" ? "View request" : "View & claim"}
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
