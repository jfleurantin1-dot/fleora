import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, ButtonLink, Card, Empty, Progress, SectionHeader, StatCard } from "@/components/ui";
import { CalendarIcon, CheckIcon, MessageIcon, StoreIcon, UsersIcon, WalletIcon } from "@/components/icons";
import { money, relativeDay, shortDate } from "@/lib/format";
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
  const reqs = (requests ?? []).slice().sort((a, b) => (catOrder.get(a.category) ?? 99) - (catOrder.get(b.category) ?? 99));
  const openQuotes = (quotes ?? []).filter((q) => q.status === "sent");
  const bk = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const bookedCats = new Set(bk.map((b) => b.category));
  const quotedCats = new Set(openQuotes.map((q) => q.category));
  const committed = bk.reduce((s, b) => s + Number(b.total), 0);
  const budget = Number(event.budget ?? 0);
  const pct = reqs.length ? Math.round((bookedCats.size / reqs.length) * 100) : 0;
  const attending = (guests ?? []).filter((g) => g.rsvp === "yes").reduce((s, g) => s + Number(g.party_size ?? 1), 0);
  const invited = (guests ?? []).reduce((s, g) => s + Number(g.party_size ?? 1), 0);
  const doneTasks = (checklist ?? []).filter((i) => i.done).length;
  const budgetRemaining = Math.max(0, budget - committed);

  return (
    <div className="space-y-7">
      {searchParams.booked && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✦ Your {categoryLabel(searchParams.booked)} vendor is booked and now part of this event.
        </div>
      )}

      <Card variant="feature" padding="lg" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blush-100/80 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="plum">{event.status}</Badge>
                {event.style && <Badge tone="blush">{event.style}</Badge>}
              </div>
              <h1 className="font-display text-4xl leading-tight text-ink-900 sm:text-5xl">{event.name}</h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5"><CalendarIcon size={16} />{shortDate(event.event_date)}</span>
                <span>{event.location ?? "Location TBD"}</span>
                <span>{event.guest_count ?? "?"} guests</span>
                {event.color_palette && <span>{event.color_palette}</span>}
              </div>
            </div>
            <ButtonLink href={`/events/${event.id}/services`} variant="secondary" size="sm">Edit event needs</ButtonLink>
          </div>

          <div className="mt-7 max-w-2xl">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-bold text-ink-900">{pct}% planned</span>
              <span className="text-ink-500">{relativeDay(event.event_date)}</span>
            </div>
            <Progress value={pct} />
          </div>
        </div>
      </Card>

      <nav className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {[
          ["#overview", "Overview"],
          ["#vendors", "Vendors"],
          ["#guests", "Guests"],
          ["#checklist", "Checklist"],
          ["#inspiration", "Inspiration"],
          ["#messages", "Messages"],
        ].map(([href, label], index) => (
          <a key={href} href={href} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${index === 0 ? "bg-plum-500 text-white" : "bg-white text-ink-600 shadow-sm hover:bg-plum-50 hover:text-plum-700"}`}>{label}</a>
        ))}
      </nav>

      <section id="overview" className="scroll-mt-28">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Budget" value={money(committed)} meta={`${money(budgetRemaining)} remaining of ${money(budget)}`} icon={<WalletIcon size={18} />} />
          <StatCard label="Guests" value={`${attending} / ${(event.guest_count ?? invited) || "—"}`} meta={`${invited} currently invited`} icon={<UsersIcon size={18} />} />
          <StatCard label="Vendors" value={`${bk.length} booked`} meta={`${Math.max(0, reqs.length - bookedCats.size)} still to find`} icon={<StoreIcon size={18} />} />
          <StatCard label="Checklist" value={`${doneTasks} / ${(checklist ?? []).length}`} meta="tasks complete" icon={<CheckIcon size={18} />} />
        </div>
      </section>

      <div className="grid gap-7 lg:grid-cols-[1.55fr_.75fr]">
        <div className="space-y-8">
          <section id="vendors" className="scroll-mt-28">
            <SectionHeader title="Your vendors" eyebrow="Marketplace" description="Everything you need, organized by service." action={<ButtonLink href={`/events/${event.id}/services`} variant="ghost" size="sm">Edit services</ButtonLink>} />
            {reqs.length === 0 ? (
              <Empty title="No services selected yet"><ButtonLink href={`/events/${event.id}/services`} size="sm" className="mt-3">Choose services</ButtonLink></Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {reqs.map((r) => {
                  const isBooked = bookedCats.has(r.category);
                  const isQuoted = quotedCats.has(r.category);
                  const booking = bk.find((b) => b.category === r.category);
                  return (
                    <Card key={r.id} variant="interactive" className="flex min-h-[116px] items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ivory-100 text-xl">{categoryEmoji(r.category)}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink-900">{categoryLabel(r.category)}</p>
                          {isBooked && booking ? (
                            <p className="mt-1 truncate text-xs font-medium text-emerald-600">Booked · {vName.get(booking.vendor_id)?.business_name}</p>
                          ) : isQuoted ? (
                            <p className="mt-1 text-xs font-medium text-plum-600">{openQuotes.filter((q) => q.category === r.category).length} quote(s) ready</p>
                          ) : (
                            <p className="mt-1 text-xs text-ink-400">Ready to find your match</p>
                          )}
                        </div>
                      </div>
                      {isBooked ? <Badge tone="green">Booked</Badge> : <ButtonLink href={`/events/${event.id}/matches/${r.category}`} size="sm" variant={isQuoted ? "secondary" : "primary"}>{isQuoted ? "Review" : "Find"}</ButtonLink>}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {openQuotes.length > 0 && (
            <section>
              <SectionHeader title="Quotes to review" eyebrow="Needs your attention" />
              <div className="space-y-3">
                {openQuotes.map((q) => (
                  <Card key={q.id} variant="interactive" className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-ink-900">{vName.get(q.vendor_id)?.business_name}</p>
                      <p className="mt-1 text-sm text-ink-600">{categoryLabel(q.category)} · {money(q.deposit)} deposit</p>
                    </div>
                    <div className="flex items-center gap-4"><span className="font-display text-xl text-ink-900">{money(q.total)}</span><ButtonLink href={`/quotes/${q.id}`} size="sm">View quote</ButtonLink></div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {bk.length > 0 && (
            <section>
              <SectionHeader title="Booked team" eyebrow="Confirmed" />
              <div className="space-y-3">
                {bk.map((b) => (
                  <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-lg">{categoryEmoji(b.category)}</span>
                      <div><p className="text-sm font-bold text-ink-900">{vName.get(b.vendor_id)?.business_name}</p><p className="mt-0.5 text-xs text-ink-600">{categoryLabel(b.category)} · {Number(b.balance) > 0 ? `${money(b.balance)} balance` : "paid in full"}</p></div>
                    </div>
                    <div className="flex items-center gap-3"><span className="text-sm font-semibold text-ink-900">{money(b.total)}</span><Badge tone={b.status === "confirmed" || b.status === "completed" ? "green" : "amber"}>{b.status.replace("_", " ")}</Badge></div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <Card id="budget" variant="feature" className="overflow-hidden">
            <div className="flex items-center justify-between gap-3"><div><p className="fleora-kicker">Budget</p><p className="mt-1 font-display text-3xl text-ink-900">{money(committed)}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-plum-600 shadow-sm"><WalletIcon size={19} /></span></div>
            <p className="mt-1 text-sm text-ink-600">committed of {money(budget)}</p>
            <div className="mt-4"><Progress value={budget > 0 ? Math.min(100, (committed / budget) * 100) : 0} /></div>
            <p className="mt-2 text-xs font-semibold text-emerald-600">{money(budgetRemaining)} remaining</p>
          </Card>

          <Card id="checklist" className="scroll-mt-28">
            <div className="mb-4 flex items-center justify-between"><div><p className="fleora-kicker">Planning</p><h3 className="mt-1 font-display text-xl text-ink-900">Checklist</h3></div><CheckIcon size={18} className="text-plum-600" /></div>
            <Checklist eventId={event.id} items={checklist ?? []} />
          </Card>

          <Card id="guests" className="scroll-mt-28">
            <div className="mb-4 flex items-center justify-between"><div><p className="fleora-kicker">People</p><h3 className="mt-1 font-display text-xl text-ink-900">Guest list</h3></div><UsersIcon size={18} className="text-plum-600" /></div>
            <GuestList eventId={event.id} guests={guests ?? []} />
          </Card>

          <Card id="inspiration" variant="soft" className="scroll-mt-28 overflow-hidden bg-gradient-to-br from-blush-50 via-white to-plum-50">
            <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-plum-600 shadow-sm">✦</span><h3 className="font-display text-xl text-ink-900">Inspiration Board</h3></div>
            <p className="text-sm leading-relaxed text-ink-600">Save the looks you love and turn them into a vendor-ready plan with Build This Look.</p>
            <Link href={`/events/${event.id}/inspiration`} className="mt-4 inline-flex text-sm font-bold text-plum-700 hover:underline">Open inspiration board →</Link>
          </Card>

          <Card id="messages" variant="soft" className="scroll-mt-28">
            <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-plum-600 shadow-sm"><MessageIcon size={17} /></span><h3 className="font-display text-xl text-ink-900">Messages</h3></div>
            <p className="text-sm leading-relaxed text-ink-600">Keep every vendor conversation attached to your planning experience.</p>
            <Link href="/messages" className="mt-4 inline-flex text-sm font-bold text-plum-700 hover:underline">Open messages →</Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
