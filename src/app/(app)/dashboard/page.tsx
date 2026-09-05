import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, Progress, SectionHeader, StatCard } from "@/components/ui";
import { CalendarIcon, ChevronRightIcon, SparkleIcon } from "@/components/icons";
import { TimeGreeting } from "@/components/time-greeting";
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
            <TimeGreeting name={profile.first_name ?? "there"} />
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
                <EventMoodCover photos={(inspirationPhotos ?? []).filter((p) => p.event_id === hero.id)} href={`/events/${hero.id}`} className="h-60 w-full lg:h-full lg:min-h-[330px]" />
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
