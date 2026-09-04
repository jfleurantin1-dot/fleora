import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, Progress, SectionHeader, StatCard } from "@/components/ui";
import { CalendarIcon, CheckIcon, ChevronRightIcon, SparkleIcon, StoreIcon, UsersIcon, WalletIcon } from "@/components/icons";
import { money, relativeDay, shortDate } from "@/lib/format";
import { EventMoodCover } from "@/components/event/event-mood-cover";

export default async function DashboardPage() {
  const profile = await requireProfile();
  if (profile.account_type === "vendor") redirect("/vendor/dashboard");
  if (profile.account_type === "admin") redirect("/admin");

  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("client_id", profile.id)
    .order("event_date", { ascending: true });

  const rows = events ?? [];
  const eventIds = rows.map((e) => e.id);
  const safeIds = eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: requests }, { data: bookings }, { data: guests }, { data: checklist }, { data: inspirationPhotos }] = await Promise.all([
    supabase.from("event_requests").select("event_id,category").in("event_id", safeIds),
    supabase.from("bookings").select("event_id,total,status,category").in("event_id", safeIds),
    supabase.from("guests").select("event_id,party_size,rsvp").in("event_id", safeIds),
    supabase.from("checklist_items").select("event_id,done").in("event_id", safeIds),
    supabase.from("event_inspiration_photos").select("event_id,url,sort").in("event_id", safeIds).order("sort"),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hero = rows.find((e) => !e.event_date || new Date(`${e.event_date}T00:00:00`) >= today) ?? rows[0];

  function statsFor(eventId: string) {
    const eventRequests = (requests ?? []).filter((r) => r.event_id === eventId);
    const eventBookings = (bookings ?? []).filter((b) => b.event_id === eventId && b.status !== "cancelled");
    const eventGuests = (guests ?? []).filter((g) => g.event_id === eventId);
    const eventChecklist = (checklist ?? []).filter((i) => i.event_id === eventId);
    const committed = eventBookings.reduce((sum, b) => sum + Number(b.total ?? 0), 0);
    const attending = eventGuests.filter((g) => g.rsvp === "yes").reduce((sum, g) => sum + Number(g.party_size ?? 1), 0);
    const invited = eventGuests.reduce((sum, g) => sum + Number(g.party_size ?? 1), 0);
    const done = eventChecklist.filter((i) => i.done).length;
    const progress = eventRequests.length ? Math.round((eventBookings.length / eventRequests.length) * 100) : 0;
    return { eventRequests, eventBookings, committed, attending, invited, done, taskTotal: eventChecklist.length, progress };
  }

  const heroStats = hero ? statsFor(hero.id) : null;

  return (
    <div className="space-y-9">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="fleora-kicker mb-2">Your planning space</p>
          <h1 className="font-display text-4xl leading-none text-ink-900 sm:text-5xl">
            Good morning, {profile.first_name ?? "there"}<span className="ml-2 text-2xl text-champagne-500">✦</span>
          </h1>
          <p className="mt-3 text-sm text-ink-600 sm:text-base">Let&apos;s make something beautiful.</p>
        </div>
        <ButtonLink href="/events/new" size="lg">+ Plan a new event</ButtonLink>
      </section>

      {!hero || !heroStats ? (
        <Empty title="Your first celebration starts here">
          <p>Tell Fleora what you&apos;re planning and we&apos;ll organize the details, build your vendor list, and keep everything in one place.</p>
          <div className="mt-5"><ButtonLink href="/events/new">Start planning</ButtonLink></div>
        </Empty>
      ) : (
        <>
          <section>
            <SectionHeader title="Your upcoming event" eyebrow="Continue planning" />
            <Card variant="feature" padding="none" className="relative overflow-hidden">
              <div className="grid lg:grid-cols-[.82fr_1.18fr]">
                <EventMoodCover photos={(inspirationPhotos ?? []).filter((p) => p.event_id === hero.id)} href={`/events/${hero.id}/inspiration`} className="h-60 w-full lg:h-full lg:min-h-[330px]" />
                <div className="relative p-6 sm:p-8">
                  <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blush-100/70 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-plum-100/70 blur-3xl" />
                  <div className="relative grid gap-7 lg:grid-cols-[1.25fr_.8fr] lg:items-center">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge tone="plum">{hero.status}</Badge>
                    {hero.event_type && <Badge tone="blush">{hero.event_type.replaceAll("_", " ")}</Badge>}
                  </div>
                  <h2 className="font-display text-3xl leading-tight text-ink-900 sm:text-4xl">{hero.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                    <span className="inline-flex items-center gap-1.5"><CalendarIcon size={16} />{shortDate(hero.event_date)}</span>
                    <span>{hero.location ?? "Location TBD"}</span>
                    <span>{hero.guest_count ?? "?"} guests</span>
                  </div>
                  <div className="mt-6 max-w-xl">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-900">{heroStats.progress}% planned</span>
                      <span className="text-ink-500">{relativeDay(hero.event_date)}</span>
                    </div>
                    <Progress value={heroStats.progress} />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <ButtonLink href={`/events/${hero.id}`}>Continue planning <ChevronRightIcon size={16} /></ButtonLink>
                    <ButtonLink href={`/events/${hero.id}/services`} variant="secondary">Edit services</ButtonLink>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/80 bg-white/75 p-5 shadow-fleora backdrop-blur">
                  <p className="fleora-kicker">Event snapshot</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between border-b fleora-divider pb-3 text-sm">
                      <span className="text-ink-600">Budget committed</span>
                      <strong className="text-ink-900">{money(heroStats.committed)} <span className="font-normal text-ink-400">/ {money(hero.budget)}</span></strong>
                    </div>
                    <div className="flex items-center justify-between border-b fleora-divider pb-3 text-sm">
                      <span className="text-ink-600">Vendors</span>
                      <strong className="text-ink-900">{heroStats.eventBookings.length} booked · {Math.max(0, heroStats.eventRequests.length - heroStats.eventBookings.length)} to find</strong>
                    </div>
                    <div className="flex items-center justify-between border-b fleora-divider pb-3 text-sm">
                      <span className="text-ink-600">Guest list</span>
                      <strong className="text-ink-900">{heroStats.attending} attending · {heroStats.invited} invited</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-600">Checklist</span>
                      <strong className="text-ink-900">{heroStats.done} / {heroStats.taskTotal} complete</strong>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
              </div>
            </Card>
          </section>

          <section>
            <SectionHeader title="Keep the momentum going" eyebrow="At a glance" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Guests" value={`${heroStats.attending} / ${(hero.guest_count ?? heroStats.invited) || "—"}`} meta="confirmed / goal" icon={<UsersIcon size={18} />} />
              <StatCard label="Budget" value={money(heroStats.committed)} meta={`${money(Math.max(0, Number(hero.budget ?? 0) - heroStats.committed))} remaining`} icon={<WalletIcon size={18} />} />
              <StatCard label="Vendors" value={`${heroStats.eventBookings.length} booked`} meta={`${Math.max(0, heroStats.eventRequests.length - heroStats.eventBookings.length)} still to find`} icon={<StoreIcon size={18} />} />
              <StatCard label="Checklist" value={`${heroStats.done} / ${heroStats.taskTotal}`} meta="tasks completed" icon={<CheckIcon size={18} />} />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
            <Card variant="interactive" padding="lg" className="overflow-hidden bg-gradient-to-br from-blush-50 via-white to-plum-50">
              <div className="flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-plum-600 shadow-sm"><SparkleIcon /></div>
                  <h2 className="font-display text-2xl text-ink-900">Have an inspiration photo?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">Save inspiration photos, choose the details you want to recreate, and turn the look into a vendor-ready plan.</p>
                  <ButtonLink href={`/events/${hero.id}/inspiration`} variant="magic" className="mt-5">✦ Build This Look</ButtonLink>
                </div>
                <div className="shrink-0"><Badge tone="champagne">Phase 2 · live preview</Badge></div>
              </div>
            </Card>

            <Card variant="soft" padding="lg">
              <p className="fleora-kicker">Quick action</p>
              <h2 className="mt-2 font-display text-2xl text-ink-900">Still need a vendor?</h2>
              <p className="mt-2 text-sm text-ink-600">Browse approved Fleora businesses or jump into your event matches.</p>
              <ButtonLink href="/vendors/browse" variant="secondary" className="mt-5 w-full">Discover vendors</ButtonLink>
            </Card>
          </section>

          {rows.length > 1 && (
            <section>
              <SectionHeader title="All your events" action={<Link href="/events" className="text-sm font-semibold text-plum-700">View all →</Link>} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.filter((e) => e.id !== hero.id).slice(0, 3).map((e) => {
                  const s = statsFor(e.id);
                  return (
                    <Card key={e.id} variant="interactive">
                      <Link href={`/events/${e.id}`} className="block">
                        <p className="fleora-kicker">{shortDate(e.event_date)}</p>
                        <h3 className="mt-1 font-display text-xl text-ink-900">{e.name}</h3>
                        <p className="mt-1 text-sm text-ink-600">{e.location ?? "Location TBD"}</p>
                        <div className="mt-5 flex items-center justify-between text-xs text-ink-600"><span>{s.progress}% planned</span><ChevronRightIcon size={16} /></div>
                        <div className="mt-2"><Progress value={s.progress} /></div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
