import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Button, PageHeader, Stars, StatCard } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";
import { setVendorStatus, reviewVendorClaim } from "./actions";
import { AddVendorForm } from "./add-vendor-form";

export default async function AdminPage() {
  const profile = await requireProfile("/admin");
  if (profile.account_type !== "admin") redirect("/dashboard");

  const supabase = createClient();
  const [
    { data: vendors },
    { data: categories },
    { data: events },
    { data: bookings },
    { data: quotes },
    { data: claims },
  ] = await Promise.all([
    supabase.from("vendors").select("*").order("created_at", { ascending: false }),
    supabase.from("vendor_categories").select("vendor_id,category"),
    supabase.from("events").select("id,name,status,event_date,budget").order("created_at", { ascending: false }),
    supabase.from("bookings").select("total,status"),
    supabase.from("quotes").select("id,status"),
    supabase.from("vendor_claims").select("*").order("created_at", { ascending: false }),
  ]);

  const claimRows = claims ?? [];
  const claimantIds = [...new Set(claimRows.map((c) => c.claimant_id))];
  const { data: claimants } = claimantIds.length
    ? await supabase.from("profiles").select("id,first_name,last_name,phone").in("id", claimantIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null; phone: string | null }[] };

  const vendorList = vendors ?? [];
  const pending = vendorList.filter((v) => v.status === "pending");
  const unclaimed = vendorList.filter((v) => !v.user_id);
  const pendingClaims = claimRows.filter((c) => c.status === "pending");
  const gmv = (bookings ?? []).filter((b) => b.status !== "cancelled").reduce((s, b) => s + Number(b.total), 0);

  const catMap = new Map<string, string[]>();
  for (const row of categories ?? []) {
    const list = catMap.get(row.vendor_id) ?? [];
    list.push(row.category);
    catMap.set(row.vendor_id, list);
  }
  const claimantMap = new Map((claimants ?? []).map((p) => [p.id, p]));
  const vendorMap = new Map(vendorList.map((v) => [v.id, v]));

  return (
    <div className="space-y-9">
      <PageHeader
        title="Fleora vendor directory"
        subtitle="Seed the Massachusetts marketplace, review claims, and manage vendor quality before client launch."
        action={<a href="#add-vendor" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-plum-500 px-4 text-sm font-semibold text-white shadow-sm hover:bg-plum-600">+ Add vendor</a>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="All vendors" value={vendorList.length} icon="🏪" />
        <StatCard label="Unclaimed" value={unclaimed.length} icon="✨" />
        <StatCard label="Claim requests" value={pendingClaims.length} icon="🙋🏽‍♀️" />
        <StatCard label="Events" value={(events ?? []).length} icon="🎉" />
        <StatCard label="Quotes" value={(quotes ?? []).length} icon="🧾" />
        <StatCard label="GMV" value={money(gmv)} icon="💳" />
      </div>

      <section id="add-vendor" className="scroll-mt-24">
        <AddVendorForm />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="fleora-kicker">Ownership</p><h2 className="font-display text-2xl text-ink-900">Profile claim requests</h2></div>
          <Badge tone={pendingClaims.length ? "amber" : "green"}>{pendingClaims.length} pending</Badge>
        </div>
        {pendingClaims.length === 0 ? (
          <Card variant="soft"><p className="text-sm text-ink-500">No claim requests waiting for review.</p></Card>
        ) : (
          <div className="space-y-3">
            {pendingClaims.map((claim) => {
              const vendor = vendorMap.get(claim.vendor_id);
              const claimant = claimantMap.get(claim.claimant_id);
              const claimantName = [claimant?.first_name, claimant?.last_name].filter(Boolean).join(" ") || "Vendor account";
              return (
                <Card key={claim.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink-900">{vendor?.business_name ?? "Vendor profile"}</p><Badge tone="amber">Claim requested</Badge></div>
                    <p className="mt-1 text-sm text-ink-600">{claimantName}{claimant?.phone ? ` · ${claimant.phone}` : ""}</p>
                    {claim.note && <p className="mt-2 rounded-xl bg-ivory-100 px-3 py-2 text-sm text-ink-600">“{claim.note}”</p>}
                    <p className="mt-2 text-xs text-ink-400">Requested {shortDate(claim.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={reviewVendorClaim.bind(null, claim.id, claim.vendor_id, claim.claimant_id, "approved")}><Button type="submit" size="sm">Approve claim</Button></form>
                    <form action={reviewVendorClaim.bind(null, claim.id, claim.vendor_id, claim.claimant_id, "rejected")}><Button type="submit" size="sm" variant="secondary">Reject</Button></form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {pending.length > 0 && (
        <section>
          <div className="mb-3"><p className="fleora-kicker">Review</p><h2 className="font-display text-2xl text-ink-900">Pending self-submitted vendors</h2></div>
          <ul className="space-y-2">
            {pending.map((v) => (
              <Card as="li" key={v.id} className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-medium text-ink-900">{v.business_name}</p><p className="text-sm text-ink-500">{v.location ?? "No location"}</p></div>
                <div className="flex gap-2">
                  <form action={setVendorStatus.bind(null, v.id, "approved")}><Button type="submit" size="sm">Approve</Button></form>
                  <form action={setVendorStatus.bind(null, v.id, "suspended")}><Button type="submit" size="sm" variant="secondary">Reject</Button></form>
                </div>
              </Card>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3"><p className="fleora-kicker">Marketplace supply</p><h2 className="font-display text-2xl text-ink-900">All vendors</h2><p className="mt-1 text-sm text-ink-500">Admin-created listings are published immediately and marked unclaimed until the owner is approved.</p></div>
        <div className="space-y-3">
          {vendorList.map((v) => (
            <Card key={v.id} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2"><Link href={`/vendors/${v.id}`} className="font-semibold text-ink-900 hover:text-plum-700">{v.business_name}</Link>{!v.user_id && <Badge tone="champagne">Unclaimed</Badge>}{v.verified && <Badge tone="plum">Verified</Badge>}<Badge tone={v.status === "approved" ? "green" : v.status === "pending" ? "amber" : "rose"}>{v.status}</Badge></div>
                <p className="mt-1 text-sm text-ink-500">{v.location ?? "Location not set"} · {v.service_radius_miles} mi radius</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><Stars rating={v.rating} count={v.review_count} />{(catMap.get(v.id) ?? []).slice(0, 5).map((c) => <Badge key={c} tone="slate">{categoryLabel(c)}</Badge>)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/vendors/${v.id}`} className="inline-flex min-h-9 items-center rounded-xl border border-plum-200 bg-white px-3 py-1.5 text-sm font-semibold text-plum-700">View profile</Link>
                {v.status !== "approved" ? <form action={setVendorStatus.bind(null, v.id, "approved")}><Button type="submit" size="sm" variant="secondary">Approve</Button></form> : <form action={setVendorStatus.bind(null, v.id, "suspended")}><Button type="submit" size="sm" variant="secondary">Suspend</Button></form>}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3"><p className="fleora-kicker">Demand</p><h2 className="font-display text-2xl text-ink-900">Recent events</h2></div>
        <ul className="space-y-2">
          {(events ?? []).slice(0, 10).map((e) => (
            <Card as="li" key={e.id} className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-ink-700">{e.name}</span><span className="text-sm text-ink-500">{shortDate(e.event_date)} · {money(e.budget)} · {e.status}</span></Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
