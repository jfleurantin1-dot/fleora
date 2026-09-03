import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ButtonLink, Card, Badge, Progress, PageHeader, Empty } from "@/components/ui";
import { money, shortDate, relativeDay } from "@/lib/format";
import { categoryEmoji, categoryLabel, CATEGORIES } from "@/lib/constants";
import { Checklist } from "@/components/event/checklist";
import { GuestList } from "@/components/event/guest-list";
import type { Vendor } from "@/lib/types";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { booked?: string };
}) {
  await requireProfile();
  const supabase = createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const [{ data: requests }, { data: quotes }, { data: bookings }, { data: checklist }, { data: guests }, { data: vendors }] =
    await Promise.all([
      supabase.from("event_requests").select("*").eq("event_id", params.id).order("created_at"),
      supabase.from("quotes").select("*").eq("event_id", params.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").eq("event_id", params.id),
      supabase.from("checklist_items").select("*").eq("event_id", params.id),
      supabase.from("guests").select("*").eq("event_id", params.id).order("created_at"),
      supabase.from("vendors").select("id,business_name,location").order("business_name"),
    ]);

  type VName = Pick<Vendor, "id" | "business_name" | "location">;
  const vName = new Map<string, VName>();
  for (const v of (vendors ?? []) as VName[]) vName.set(v.id, v);
  const catOrder = new Map(CATEGORIES.map((c, i) => [c.key, i] as [string, number]));
  const reqs = (requests ?? [])
    .slice()
    .sort((a, b) => (catOrder.get(a.category) ?? 99) - (catOrder.get(b.category) ?? 99));
  const openQuotes = (quotes ?? []).filter((q) => q.status === "sent");
  const bk = bookings ?? [];

  const bookedCats = new Set(bk.filter((b) => b.status !== "cancelled").map((b) => b.category));
  const quotedCats = new Set(openQuotes.map((q) => q.category));

  const committed = bk.filter((b) => b.status !== "cancelled").reduce((s, b) => s + Number(b.total), 0);
  const budget = Number(event.budget ?? 0);
  const pct = reqs.length ? Math.round((bookedCats.size / reqs.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={event.name}
        subtitle={`${shortDate(event.event_date)} · ${event.location ?? "Location TBD"} · ${
          event.guest_count ?? "?"
        } guests${event.color_palette ? ` · ${event.color_palette}` : ""}`}
        action={
          <ButtonLink href={`/events/${event.id}/services`} variant="secondary" size="sm">
            Edit services
          </ButtonLink>
        }
      />

      {searchParams.booked && (
        <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          🎉 Booked your {categoryLabel(searchParams.booked)} vendor. It&apos;s on your dashboard below.
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">Progress</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pct}%</p>
          <div className="mt-2">
            <Progress value={pct} />
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">Committed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money(committed)}</p>
          <p className="mt-2 text-sm text-slate-500">of {money(budget)} budget</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">Countdown</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{relativeDay(event.event_date) || "—"}</p>
          <p className="mt-2 text-sm text-slate-500">{shortDate(event.event_date)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* main column */}
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Your event needs
            </h2>
            {reqs.length === 0 ? (
              <Empty title="No services selected yet">
                <ButtonLink href={`/events/${event.id}/services`} size="sm" className="mt-3">
                  Choose services
                </ButtonLink>
              </Empty>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {reqs.map((r) => {
                  const isBooked = bookedCats.has(r.category);
                  const isQuoted = quotedCats.has(r.category);
                  const booking = bk.find((b) => b.category === r.category);
                  return (
                    <Card as="li" key={r.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          <span className="mr-1">{categoryEmoji(r.category)}</span>
                          {categoryLabel(r.category)}
                        </p>
                        {isBooked && booking ? (
                          <p className="truncate text-xs text-emerald-600">
                            Booked · {vName.get(booking.vendor_id)?.business_name}
                          </p>
                        ) : isQuoted ? (
                          <p className="text-xs text-plum-600">
                            {openQuotes.filter((q) => q.category === r.category).length} quote(s) in
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">No vendors yet</p>
                        )}
                      </div>
                      {isBooked ? (
                        <Badge tone="green">Booked</Badge>
                      ) : (
                        <ButtonLink
                          href={`/events/${event.id}/matches/${r.category}`}
                          size="sm"
                          variant={isQuoted ? "secondary" : "primary"}
                        >
                          {isQuoted ? "Review" : "Find"}
                        </ButtonLink>
                      )}
                    </Card>
                  );
                })}
              </ul>
            )}
          </section>

          {openQuotes.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Quotes to review
              </h2>
              <ul className="space-y-2">
                {openQuotes.map((q) => (
                  <Card as="li" key={q.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {vName.get(q.vendor_id)?.business_name} ·{" "}
                        <span className="text-slate-500">{categoryLabel(q.category)}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {money(q.total)} · {money(q.deposit)} deposit
                      </p>
                    </div>
                    <ButtonLink href={`/quotes/${q.id}`} size="sm">
                      View quote
                    </ButtonLink>
                  </Card>
                ))}
              </ul>
            </section>
          )}

          {bk.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Booked vendors
              </h2>
              <ul className="space-y-2">
                {bk.map((b) => (
                  <Card as="li" key={b.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {vName.get(b.vendor_id)?.business_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {categoryLabel(b.category)} · {money(b.total)} ·{" "}
                        {Number(b.balance) > 0 ? `${money(b.balance)} balance` : "paid in full"}
                      </p>
                    </div>
                    <Badge tone={b.status === "confirmed" || b.status === "completed" ? "green" : "amber"}>
                      {b.status.replace("_", " ")}
                    </Badge>
                  </Card>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="mb-3 font-semibold text-slate-900">Checklist</h3>
            <Checklist eventId={event.id} items={checklist ?? []} />
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold text-slate-900">Guest list</h3>
            <GuestList eventId={event.id} guests={guests ?? []} />
          </Card>
          <Card>
            <h3 className="mb-1 font-semibold text-slate-900">Messages</h3>
            <p className="mb-3 text-sm text-slate-500">Conversations attached to this event.</p>
            <Link href="/messages" className="text-sm font-medium text-plum-700 hover:underline">
              Open messages →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
