import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, ButtonLink, Card, Field, Input } from "@/components/ui";
import { blockDateRange, removeBlockedDate } from "./actions";

function prettyDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export default async function VendorAvailabilityPage() {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("vendor_unavailable_dates")
    .select("id, unavailable_date, note")
    .eq("vendor_id", vendor.id)
    .gte("unavailable_date", today)
    .order("unavailable_date");
  const blocked = data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="fleora-kicker">Vendor tools</p>
          <h1 className="mt-1 font-display text-4xl text-ink-900">Availability</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Block dates you cannot accept events. Fleora can use these dates to keep your leads more relevant.</p>
        </div>
        <ButtonLink href="/vendor/dashboard" variant="secondary">Back to dashboard</ButtonLink>
      </div>

      <Card variant="feature" className="space-y-4">
        <div>
          <p className="fleora-kicker">Block dates</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900">When are you unavailable?</h2>
          <p className="mt-1 text-sm text-ink-500">Choose one day or an entire date range.</p>
        </div>
        <form action={blockDateRange} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end">
          <Field label="Start date">
            <Input type="date" name="start_date" min={today} required />
          </Field>
          <Field label="End date" hint="Leave blank for one day.">
            <Input type="date" name="end_date" min={today} />
          </Field>
          <Field label="Note" hint="Optional — only you see this here.">
            <Input name="note" placeholder="Already booked, vacation, personal day…" />
          </Field>
          <Button type="submit" className="lg:mb-[1px]">Block dates</Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="fleora-kicker">Upcoming</p>
            <h2 className="mt-1 font-display text-2xl text-ink-900">Blocked dates</h2>
          </div>
          <span className="rounded-full bg-plum-50 px-3 py-1 text-xs font-bold text-plum-700">{blocked.length} blocked</span>
        </div>
        {blocked.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-plum-200 bg-ivory-50 p-7 text-center">
            <p className="font-semibold text-ink-800">Your calendar is wide open.</p>
            <p className="mt-1 text-sm text-ink-500">Block dates as soon as you know you are unavailable.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E9E3E7]">
            {blocked.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="font-semibold text-ink-900">{prettyDate(item.unavailable_date)}</p>
                  {item.note && <p className="mt-0.5 text-sm text-ink-500">{item.note}</p>}
                </div>
                <form action={removeBlockedDate}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">Make available</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card variant="soft">
        <p className="text-sm leading-relaxed text-ink-600"><strong className="text-ink-900">Your service area:</strong> {vendor.location || "Not set yet"} · {vendor.service_radius_miles} mile radius. You can change this anytime in your profile.</p>
        <div className="mt-3"><ButtonLink href="/vendor/onboarding" variant="ghost">Edit service area →</ButtonLink></div>
      </Card>
    </div>
  );
}
