import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, ButtonLink, Card, Empty, Progress, SectionHeader } from "@/components/ui";
import { CalendarIcon, CheckIcon, MapPinIcon, MessageIcon, SparkleIcon, StoreIcon, UsersIcon, WalletIcon } from "@/components/icons";
import { money, relativeDay, shortDate } from "@/lib/format";
import { categoryLabel, CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { Checklist } from "@/components/event/checklist";
import { GuestList } from "@/components/event/guest-list";
import type { Vendor } from "@/lib/types";
import { EventMoodCover } from "@/components/event/event-mood-cover";
import { EventStatusControls } from "@/components/event/event-status-controls";

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

  const [{ data: requests }, { data: quotes }, { data: bookings }, { data: checklist }, { data: guests }, { data: vendors }, { data: inspirationPhotos }] =
    await Promise.all([
      supabase.from("event_requests").select("*").eq("event_id", params.id).order("created_at"),
      supabase.from("quotes").select("*").eq("event_id", params.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").eq("event_id", params.id),
      supabase.from("checklist_items").select("*").eq("event_id", params.id),
      supabase.from("guests").select("*").eq("event_id", params.id).order("created_at"),
      supabase.from("vendors").select("id,business_name,location").order("business_name"),
      supabase.from("event_inspiration_photos").select("id,url,sort").eq("event_id", params.id).order("sort"),
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
  const attending = (guests ?? []).filter((g) => g.rsvp === "yes").reduce((s, g) => s + Number(g.party_size ?? 1), 0);
  const invited = (guests ?? []).reduce((s, g) => s + Number(g.party_size ?? 1), 0);
  const awaiting = (guests ?? []).filter((g) => g.rsvp === "pending").length;
  const doneTasks = (checklist ?? []).filter((i) => i.done).length;
  const budgetRemaining = Math.max(0, budget - committed);
  const stillNeeded = Math.max(0, reqs.length - bookedCats.size);
  const planningSteps = [
    { label: "Event details", done: Boolean(event.event_date && event.location && event.guest_count && budget > 0) },
    { label: "Mood board", done: (inspirationPhotos ?? []).length > 0 },
    { label: "Guest list", done: (guests ?? []).length > 0 },
    { label: "Checklist", done: (checklist ?? []).length > 0 },
    { label: "Vendors", done: reqs.length > 0 },
    { label: "Bookings", done: reqs.length > 0 && bookedCats.size >= reqs.length },
  ];
  const completedPlanningSteps = planningSteps.filter((step) => step.done).length;
  const pct = Math.round((completedPlanningSteps / planningSteps.length) * 100);

  const nextSteps: Array<{ title: string; description: string; href: string; action: string }> = [];
  if (!(inspirationPhotos ?? []).length) nextSteps.push({ title: "Give your event a look", description: "Add inspiration photos so your mood board becomes the visual home for this event.", href: `/events/${event.id}/edit`, action: "Add inspiration" });
  if (!(guests ?? []).length) nextSteps.push({ title: "Start your guest list", description: "Add guests now so RSVPs and headcount stay organized in one place.", href: "#guests", action: "Add guests" });
  if (!reqs.length) nextSteps.push({ title: "Build your event team", description: "Choose the services you need and Fleora will help you find matching vendors.", href: `/events/${event.id}/services`, action: "Choose services" });
  else if (stillNeeded > 0) {
    const firstNeeded = reqs.find((r) => !bookedCats.has(r.category));
    if (firstNeeded) nextSteps.push({ title: `Find your ${categoryLabel(firstNeeded.category)}`, description: `${stillNeeded} service${stillNeeded === 1 ? "" : "s"} still need a vendor for this event.`, href: `/events/${event.id}/matches/${firstNeeded.category}`, action: "Explore vendors" });
  }
  if (openQuotes.length) nextSteps.unshift({ title: "A quote needs your attention", description: `You have ${openQuotes.length} quote${openQuotes.length === 1 ? "" : "s"} ready to review.`, href: openQuotes.length === 1 ? `/quotes/${openQuotes[0].id}` : "#quotes", action: openQuotes.length === 1 ? "View quote" : "Review quotes" });
  if (!nextSteps.length && (checklist ?? []).length > doneTasks) nextSteps.push({ title: "Keep the plan moving", description: `${(checklist ?? []).length - doneTasks} checklist item${(checklist ?? []).length - doneTasks === 1 ? "" : "s"} still to complete.`, href: "#checklist", action: "View checklist" });

  return (
    <div className="space-y-7">
      {searchParams.booked && (
        <div className="rounded-2xl border border-sage-100 bg-sage-50 px-4 py-3 text-sm font-medium text-sage-700">
          Your {categoryLabel(searchParams.booked)} vendor is booked and now part of this event.
        </div>
      )}

      <Card variant="feature" padding="none" className="relative overflow-hidden">
        <div className="grid lg:grid-cols-[.9fr_1.1fr]">
          <EventMoodCover photos={inspirationPhotos ?? []} className="h-64 w-full lg:h-full lg:min-h-[340px]" emptyLabel="Add mood board photos" />
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blush-100/80 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge tone={event.status === "completed" ? "green" : event.status === "cancelled" ? "rose" : "plum"}>{event.status}</Badge>
                    {event.style && <Badge tone="blush">{event.style}</Badge>}
                  </div>
                  <h1 className="font-display text-4xl leading-tight text-ink-900 sm:text-5xl">{event.name}</h1>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                    <span className="inline-flex items-center gap-1.5"><CalendarIcon size={16} />{shortDate(event.event_date)}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPinIcon size={16} />{event.location ?? "Location TBD"}</span>
                    <span>{event.guest_count ?? "?"} guests</span>
                    {event.color_palette && <span>{event.color_palette}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2"><ButtonLink href={`/events/${event.id}/edit`} variant="secondary" size="sm">Edit event</ButtonLink><ButtonLink href={`/events/${event.id}/services`} variant="ghost" size="sm">Edit services</ButtonLink></div>
              </div>

              <div className="mt-7 max-w-3xl">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-ink-900">{pct}% planned</span>
                  <span className="text-ink-500">{relativeDay(event.event_date)}</span>
                </div>
                <Progress value={pct} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {planningSteps.map((step) => (
                    <span key={step.label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${step.done ? "bg-sage-50 text-sage-700" : "bg-white text-ink-500 shadow-sm"}`}>
                      {step.done && <CheckIcon size={12} />}
                      {step.label}
                    </span>
                  ))}
                </div>

                <div className="mt-6 border-t border-plum-100 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><p className="fleora-kicker">Event overview</p><h2 className="mt-1 font-display text-2xl text-ink-900">Your plan at a glance</h2></div>
                    <span className="text-xs font-semibold text-ink-500">{completedPlanningSteps} of {planningSteps.length} planning steps started</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <OverviewRow icon={<CalendarIcon size={17} />} label="Date" value={shortDate(event.event_date)} />
                    <OverviewRow icon={<MapPinIcon size={17} />} label="Location" value={event.location ?? "TBD"} />
                    <OverviewRow icon={<UsersIcon size={17} />} label="Guests" value={invited ? `${attending} attending · ${awaiting} awaiting` : `${event.guest_count ?? "?"} expected`} accent="blush" />
                    <OverviewRow icon={<StoreIcon size={17} />} label="Vendors" value={`${bk.length} booked · ${stillNeeded} to find`} accent="sage" />
                    <OverviewRow icon={<WalletIcon size={17} />} label="Budget" value={`${money(committed)} of ${money(budget)}`} />
                    <OverviewRow icon={<CheckIcon size={17} />} label="Checklist" value={`${doneTasks} of ${(checklist ?? []).length} complete`} accent="sage" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <EventStatusControls eventId={event.id} status={event.status} />

      {nextSteps.length > 0 && (
        <section>
          <SectionHeader title="What’s next" eyebrow="Keep planning" description="Fleora is keeping an eye on the pieces that still need your attention." />
          <div className="grid gap-3 md:grid-cols-3">
            {nextSteps.slice(0, 3).map((step, index) => (
              <Card key={`${step.title}-${index}`} variant="interactive" className="flex h-full flex-col">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-plum-50 text-plum-700"><SparkleIcon size={18} /></span>
                <h3 className="mt-4 font-display text-xl text-ink-900">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{step.description}</p>
                <Link href={step.href} className="mt-4 inline-flex text-sm font-bold text-plum-700 hover:underline">{step.action} →</Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      {openQuotes.length > 0 && (
        <Card variant="feature" padding="lg" className="border-plum-200 bg-gradient-to-r from-plum-50 via-white to-blush-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blush-100 text-plum-700"><MessageIcon size={25} /></span>
              <div>
                <p className="fleora-kicker">Quote ready</p>
                <h2 className="mt-1 font-display text-2xl text-ink-900">You have {openQuotes.length} quote{openQuotes.length === 1 ? "" : "s"} waiting for review.</h2>
                <p className="mt-1 text-sm text-ink-600">Review pricing, deposit details and vendor notes before you book.</p>
              </div>
            </div>
            <ButtonLink href={openQuotes.length === 1 ? `/quotes/${openQuotes[0].id}` : "#quotes"} size="lg">{openQuotes.length === 1 ? "View quote" : "Review quotes"}</ButtonLink>
          </div>
        </Card>
      )}

      <nav className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {[
          ["#vendors", "Event team"],
          ["#quotes", `Quotes${openQuotes.length ? ` (${openQuotes.length})` : ""}`],
          [`/events/${event.id}/payments`, "Payments"],
          ["#guests", "Guests"],
          ["#checklist", "Checklist"],
          ["#messages", "Messages"],
        ].map(([href, label], index) => (
          <a key={href} href={href} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${index === 0 ? "bg-plum-500 text-white" : "bg-white text-ink-600 shadow-sm hover:bg-plum-50 hover:text-plum-700"}`}>{label}</a>
        ))}
      </nav>

      <section id="vendors" className="scroll-mt-28">
        <div>
            <SectionHeader
              title="Your Event Team"
              eyebrow="Marketplace"
              description={`${reqs.length} services selected · ${bk.length} booked · ${stillNeeded} still to find`}
              action={<ButtonLink href={`/events/${event.id}/services`} variant="ghost" size="sm">Edit services</ButtonLink>}
            />
            {reqs.length === 0 ? (
              <Empty title="No services selected yet"><ButtonLink href={`/events/${event.id}/services`} size="sm" className="mt-3">Choose services</ButtonLink></Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {reqs.map((r) => {
                  const isBooked = bookedCats.has(r.category);
                  const isQuoted = quotedCats.has(r.category);
                  const booking = bk.find((b) => b.category === r.category);
                  const quoteCount = openQuotes.filter((q) => q.category === r.category).length;
                  return (
                    <Card key={r.id} variant="interactive" className={`group relative flex min-h-[126px] items-center gap-4 overflow-hidden ${isBooked ? "border-sage-100 bg-sage-50/35" : isQuoted ? "border-blush-100 bg-blush-50/35" : "bg-white"}`}>
                      <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-[20px] ${isBooked ? "bg-sage-100 text-sage-700" : isQuoted ? "bg-blush-100 text-[#9B5065]" : "bg-plum-50 text-plum-700"}`}><CategoryIcon category={r.category} size={30}/></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink-900">{categoryLabel(r.category)}</p>
                        {isBooked && booking ? (
                          <><p className="mt-1 truncate text-xs font-semibold text-sage-700">Booked · {vName.get(booking.vendor_id)?.business_name}</p><Link href={`/events/${event.id}/matches/${r.category}`} className="mt-3 inline-flex text-xs font-bold text-sage-700 hover:underline">View category →</Link></>
                        ) : isQuoted ? (
                          <><p className="mt-1 text-xs font-semibold text-[#9B5065]">{quoteCount} quote{quoteCount === 1 ? "" : "s"} ready to review</p><Link href="#quotes" className="mt-3 inline-flex text-xs font-bold text-plum-700 hover:underline">Review quote →</Link></>
                        ) : (
                          <><p className="mt-1 text-xs text-ink-500">Find a vendor that fits your event.</p><Link href={`/events/${event.id}/matches/${r.category}`} className="mt-3 inline-flex text-xs font-bold text-plum-700 hover:underline">Explore vendors →</Link></>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
        </div>
      </section>

      <div className="grid gap-7 lg:grid-cols-[1.55fr_.75fr]">
        <div className="space-y-8">
          {openQuotes.length > 0 && (
            <section id="quotes" className="scroll-mt-28">
              <SectionHeader title="Quotes to review" eyebrow="Needs your attention" description="Compare your vendor quotes and book when you’re ready." />
              <div className="space-y-3">
                {openQuotes.map((q) => (
                  <Card key={q.id} variant="interactive" className="flex flex-wrap items-center justify-between gap-4">
                    <div><p className="font-bold text-ink-900">{vName.get(q.vendor_id)?.business_name}</p><p className="mt-1 text-sm text-ink-600">{categoryLabel(q.category)} · {money(q.deposit)} deposit</p></div>
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
                  <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3 border-sage-100 bg-sage-50/30">
                    <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-sage-700"><CategoryIcon category={b.category} size={24}/></span><div><p className="text-sm font-bold text-ink-900">{vName.get(b.vendor_id)?.business_name}</p><p className="mt-0.5 text-xs text-ink-600">{categoryLabel(b.category)} · {Number(b.balance) > 0 ? `${money(b.balance)} balance` : "paid in full"}</p></div></div>
                    <div className="flex items-center gap-3"><span className="text-sm font-semibold text-ink-900">{money(b.total)}</span><Badge tone={b.status === "confirmed" || b.status === "completed" ? "green" : "amber"}>{b.status.replace("_", " ")}</Badge></div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <Card id="checklist" className="scroll-mt-28">
            <div className="mb-4 flex items-center justify-between"><div><p className="fleora-kicker">Planning</p><h3 className="mt-1 font-display text-xl text-ink-900">Checklist</h3></div><CheckIcon size={24} className="text-sage-700" /></div>
            <Checklist eventId={event.id} items={checklist ?? []} />
          </Card>

          <Card id="guests" className="scroll-mt-28">
            <div className="mb-4 flex items-center justify-between"><div><p className="fleora-kicker">People</p><h3 className="mt-1 font-display text-xl text-ink-900">Guest list</h3></div><UsersIcon size={24} className="text-[#9B5065]" /></div>
            <GuestList eventId={event.id} guests={guests ?? []} />
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

function OverviewRow({ icon, label, value, accent = "plum" }: { icon: React.ReactNode; label: string; value: string; accent?: "plum" | "sage" | "blush" }) {
  const iconClass = accent === "sage" ? "bg-sage-50 text-sage-700" : accent === "blush" ? "bg-blush-50 text-[#9B5065]" : "bg-plum-50 text-plum-700";
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconClass}`}>{icon}</span>
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{label}</p><p className="truncate text-sm font-semibold text-ink-800">{value}</p></div>
    </div>
  );
}
