import { redirect } from "next/navigation";
import Link from "next/link";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, ButtonLink, PageHeader, Empty, Stars } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";

export default async function VendorDashboard() {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: convos }, { data: quotes }, { data: bookings }, { data: events }] = await Promise.all([
    supabase.from("conversations").select("*").eq("vendor_id", vendor.id),
    supabase.from("quotes").select("id,event_id,status,total,category").eq("vendor_id", vendor.id),
    supabase.from("bookings").select("*").eq("vendor_id", vendor.id),
    supabase.from("events").select("id,name,event_date,location,guest_count,budget,style"),
  ]);

  type EventBrief = NonNullable<typeof events>[number];
  const eventMap = new Map<string, EventBrief>();
  for (const e of events ?? []) eventMap.set(e.id, e);
  const quotedEventIds = new Set((quotes ?? []).map((q) => q.event_id));
  const newLeads = (convos ?? []).filter((c) => !quotedEventIds.has(c.event_id));

  const activeBookings = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const upcoming = activeBookings.filter((b) => {
    const d = eventMap.get(b.event_id)?.event_date;
    return d && d >= today;
  });
  const upcomingRevenue = upcoming.reduce((s, b) => s + Number(b.total), 0);

  return (
    <div>
      <PageHeader
        title={`Good day, ${vendor.business_name} 👋`}
        subtitle={vendor.status === "approved" ? "You're live on Fleora." : "Your profile is pending admin approval."}
        action={
          <ButtonLink href="/vendor/onboarding" variant="secondary" size="sm">
            Edit profile
          </ButtonLink>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">New leads</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{newLeads.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming bookings</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{upcoming.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming revenue</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money(upcomingRevenue)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">Rating</p>
          <p className="mt-1"><Stars rating={vendor.rating} count={vendor.review_count} /></p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              New leads
            </h2>
            <Link href="/vendor/leads" className="text-sm text-plum-700 hover:underline">
              All leads →
            </Link>
          </div>
          {newLeads.length === 0 ? (
            <Empty title="No new leads right now" />
          ) : (
            <ul className="space-y-2">
              {newLeads.map((c) => {
                const e = eventMap.get(c.event_id);
                return (
                  <Card as="li" key={c.id}>
                    <Link href={`/messages/${c.id}`} className="block">
                      <p className="font-medium text-slate-900">{e?.name}</p>
                      <p className="text-sm text-slate-500">
                        {shortDate(e?.event_date)} · {e?.location ?? "TBD"} · {e?.guest_count ?? "?"}{" "}
                        guests · {money(e?.budget)}
                      </p>
                      {e?.style && <Badge tone="slate">{e.style}</Badge>}
                    </Link>
                  </Card>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Upcoming bookings
          </h2>
          {upcoming.length === 0 ? (
            <Empty title="Nothing booked yet" />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((b) => {
                const e = eventMap.get(b.event_id);
                return (
                  <Card as="li" key={b.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{e?.name}</p>
                      <p className="text-sm text-slate-500">
                        {categoryLabel(b.category)} · {shortDate(e?.event_date)} · {money(b.total)}
                      </p>
                    </div>
                    <Badge tone={b.status === "confirmed" ? "green" : "amber"}>
                      {b.status.replace("_", " ")}
                    </Badge>
                  </Card>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
