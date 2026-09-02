import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Button, PageHeader, Stars } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { setVendorStatus } from "./actions";

export default async function AdminPage() {
  const profile = await requireProfile("/admin");
  if (profile.account_type !== "admin") redirect("/dashboard");

  const supabase = createClient();
  const [{ data: vendors }, { data: events }, { data: bookings }, { data: quotes }] = await Promise.all([
    supabase.from("vendors").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("id,name,status,event_date,budget").order("created_at", { ascending: false }),
    supabase.from("bookings").select("total,status"),
    supabase.from("quotes").select("id,status"),
  ]);

  const pending = (vendors ?? []).filter((v) => v.status === "pending");
  const gmv = (bookings ?? [])
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + Number(b.total), 0);

  const metrics = [
    { label: "Vendors", value: (vendors ?? []).length },
    { label: "Pending approval", value: pending.length },
    { label: "Events", value: (events ?? []).length },
    { label: "Quotes sent", value: (quotes ?? []).length },
    { label: "Bookings", value: (bookings ?? []).length },
    { label: "GMV", value: money(gmv) },
  ];

  return (
    <div>
      <PageHeader title="Fleora admin" subtitle="Marketplace health and vendor approvals." />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <Card key={m.label}>
            <p className="text-xs uppercase tracking-wide text-slate-400">{m.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{m.value}</p>
          </Card>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pending vendors
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing waiting for review.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((v) => (
              <Card as="li" key={v.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{v.business_name}</p>
                  <p className="text-sm text-slate-500">{v.location ?? "No location"}</p>
                </div>
                <div className="flex gap-2">
                  <form action={setVendorStatus.bind(null, v.id, "approved")}>
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form action={setVendorStatus.bind(null, v.id, "suspended")}>
                    <Button type="submit" size="sm" variant="secondary">
                      Reject
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          All vendors
        </h2>
        <ul className="space-y-2">
          {(vendors ?? []).map((v) => (
            <Card as="li" key={v.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{v.business_name}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Stars rating={v.rating} count={v.review_count} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={v.status === "approved" ? "green" : v.status === "pending" ? "amber" : "rose"}
                >
                  {v.status}
                </Badge>
                {v.status !== "approved" ? (
                  <form action={setVendorStatus.bind(null, v.id, "approved")}>
                    <Button type="submit" size="sm" variant="secondary">
                      Approve
                    </Button>
                  </form>
                ) : (
                  <form action={setVendorStatus.bind(null, v.id, "suspended")}>
                    <Button type="submit" size="sm" variant="secondary">
                      Suspend
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Events</h2>
        <ul className="space-y-2">
          {(events ?? []).map((e) => (
            <Card as="li" key={e.id} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{e.name}</span>
              <span className="text-sm text-slate-500">
                {shortDate(e.event_date)} · {money(e.budget)} · {e.status}
              </span>
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
