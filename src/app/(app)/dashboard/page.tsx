import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Card, Empty, PageHeader, Progress, Badge } from "@/components/ui";
import { money, shortDate, relativeDay } from "@/lib/format";

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

  const [{ data: requests }, { data: bookings }] = await Promise.all([
    supabase
      .from("event_requests")
      .select("event_id")
      .in("event_id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("bookings")
      .select("event_id,total,status")
      .in("event_id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const reqCount = new Map<string, number>();
  for (const r of requests ?? []) reqCount.set(r.event_id, (reqCount.get(r.event_id) ?? 0) + 1);
  const bookingsByEvent = new Map<string, { total: number; status: string }[]>();
  for (const b of bookings ?? []) {
    const arr = bookingsByEvent.get(b.event_id) ?? [];
    arr.push({ total: Number(b.total), status: b.status });
    bookingsByEvent.set(b.event_id, arr);
  }

  return (
    <div>
      <PageHeader
        title={`Hi ${profile.first_name ?? "there"} 👋`}
        subtitle="Your events, all in one place."
        action={
          <ButtonLink href="/events/new" size="md">
            + New event
          </ButtonLink>
        }
      />

      {rows.length === 0 ? (
        <Empty title="No events yet">
          <p>Create your first event and we&apos;ll build your plan and match you with vendors.</p>
          <div className="mt-4">
            <ButtonLink href="/events/new">Plan an event</ButtonLink>
          </div>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((e) => {
            const requestCount = reqCount.get(e.id) ?? 0;
            const booked = (bookingsByEvent.get(e.id) ?? []).filter((b) => b.status !== "cancelled");
            const committed = booked.reduce((s, b) => s + b.total, 0);
            const pct = requestCount ? Math.round((booked.length / requestCount) * 100) : 0;

            return (
              <Card as="li" key={e.id} className="transition hover:ring-plum-200">
                <Link href={`/events/${e.id}`} className="block space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{e.name}</h3>
                      <p className="text-sm text-slate-500">
                        {shortDate(e.event_date)} · {e.location ?? "Location TBD"} ·{" "}
                        {e.guest_count ?? "?"} guests
                      </p>
                    </div>
                    <Badge tone={e.status === "planning" ? "plum" : "green"}>{e.status}</Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        {booked.length}/{requestCount} vendors booked
                      </span>
                      <span>{relativeDay(e.event_date)}</span>
                    </div>
                    <Progress value={pct} />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Budget</span>
                    <span className="font-medium text-slate-800">
                      {money(committed)} / {money(e.budget)}
                    </span>
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
