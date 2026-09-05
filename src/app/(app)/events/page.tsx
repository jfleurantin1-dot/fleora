import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, ButtonLink, Card, Empty, PageHeader, Progress } from "@/components/ui";
import { CalendarIcon, ChevronRightIcon } from "@/components/icons";
import { money, relativeDay, shortDate } from "@/lib/format";
import { EventMoodCover } from "@/components/event/event-mood-cover";

export default async function EventsPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: events } = await supabase.from("events").select("*").eq("client_id", profile.id);
  const rows = events ?? [];
  const ids = rows.map((e) => e.id);
  const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: requests }, { data: bookings }, { data: inspirationPhotos }] = await Promise.all([
    supabase.from("event_requests").select("event_id").in("event_id", safeIds),
    supabase.from("bookings").select("event_id,total,status").in("event_id", safeIds),
    supabase.from("event_inspiration_photos").select("event_id,url,sort").in("event_id", safeIds).order("sort"),
  ]);

  const byDateAsc = (a: (typeof rows)[number], b: (typeof rows)[number]) => String(a.event_date ?? "9999-12-31").localeCompare(String(b.event_date ?? "9999-12-31"));
  const byDateDesc = (a: (typeof rows)[number], b: (typeof rows)[number]) => String(b.event_date ?? "0000-01-01").localeCompare(String(a.event_date ?? "0000-01-01"));
  const active = rows.filter((e) => e.status === "planning" || e.status === "active").sort(byDateAsc);
  const completed = rows.filter((e) => e.status === "completed").sort(byDateDesc);
  const cancelled = rows.filter((e) => e.status === "cancelled").sort(byDateDesc);

  function EventCards({ list }: { list: typeof rows }) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => {
          const reqCount = (requests ?? []).filter((r) => r.event_id === e.id).length;
          const eventBookings = (bookings ?? []).filter((b) => b.event_id === e.id && b.status !== "cancelled");
          const committed = eventBookings.reduce((sum, b) => sum + Number(b.total ?? 0), 0);
          const pct = reqCount ? Math.round((eventBookings.length / reqCount) * 100) : 0;
          const tone = e.status === "completed" ? "green" : e.status === "cancelled" ? "rose" : "plum";
          return (
            <Card key={e.id} variant="interactive" padding="none" className={`overflow-hidden ${e.status === "cancelled" ? "opacity-80" : ""}`}>
              <EventMoodCover photos={(inspirationPhotos ?? []).filter((p) => p.event_id === e.id)} href={`/events/${e.id}`} className="h-44 w-full" />
              <Link href={`/events/${e.id}`} className="block">
                <div className="bg-gradient-to-br from-blush-50 via-ivory-50 to-plum-50 p-5">
                  <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-plum-600 shadow-sm"><CalendarIcon size={18} /></span><Badge tone={tone}>{e.status}</Badge></div>
                  <h2 className="mt-6 font-display text-2xl text-ink-900">{e.name}</h2>
                  <p className="mt-1 text-sm text-ink-600">{shortDate(e.event_date)} · {e.location ?? "Location TBD"}</p>
                </div>
                <div className="p-5">
                  <div className="flex justify-between text-xs font-semibold text-ink-600"><span>{pct}% planned</span><span>{e.status === "planning" || e.status === "active" ? relativeDay(e.event_date) : e.status}</span></div>
                  <div className="mt-2"><Progress value={pct} /></div>
                  <div className="mt-5 flex items-center justify-between border-t fleora-divider pt-4"><div><p className="text-[11px] uppercase tracking-wide text-ink-400">Committed</p><p className="font-semibold text-ink-900">{money(committed)} <span className="font-normal text-ink-400">/ {money(e.budget)}</span></p></div><ChevronRightIcon size={18} className="text-plum-600" /></div>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My events" subtitle="Every celebration, every detail, all in one place." action={<ButtonLink href="/events/new">+ New event</ButtonLink>} />
      {rows.length === 0 ? (
        <Empty title="No events yet"><p>Create your first event and Fleora will help you build the plan.</p><div className="mt-4"><ButtonLink href="/events/new">Plan an event</ButtonLink></div></Empty>
      ) : (
        <div className="space-y-10">
          {active.length > 0 && <section><div className="mb-4"><p className="fleora-kicker">Front and center</p><h2 className="mt-1 font-display text-2xl text-ink-900">Upcoming & planning</h2></div><EventCards list={active} /></section>}
          {completed.length > 0 && <section className="border-t border-plum-50 pt-8"><div className="mb-4"><p className="fleora-kicker">Archive</p><h2 className="mt-1 font-display text-2xl text-ink-900">Completed</h2></div><EventCards list={completed} /></section>}
          {cancelled.length > 0 && <section className="border-t border-plum-50 pt-8"><div className="mb-4"><p className="fleora-kicker">Archive</p><h2 className="mt-1 font-display text-2xl text-ink-900">Canceled</h2></div><EventCards list={cancelled} /></section>}
        </div>
      )}
    </div>
  );
}
