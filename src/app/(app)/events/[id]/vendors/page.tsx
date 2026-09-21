import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";
import { Badge, Button, ButtonLink, Card, Empty, Select } from "@/components/ui";
import { CATEGORIES, CATEGORY_GROUPS, categoryLabel } from "@/lib/constants";
import { ChevronRightIcon, StoreIcon } from "@/components/icons";
import { addVendorNeed } from "./actions";

type Status = "needed" | "searching" | "inquired" | "quote" | "payment" | "booked";

const tone = (status: Status) => status === "booked" ? "green" : status === "payment" || status === "quote" ? "amber" : status === "inquired" || status === "searching" ? "plum" : "slate";
const statusText = (status: Status) => status === "booked" ? "Booked" : status === "payment" ? "Awaiting payment" : status === "quote" ? "Quote received" : status === "inquired" ? "Inquiry sent" : status === "searching" ? "Searching" : "Needed";

export default async function VendorsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await requireProfile();
  const db = await createClient();
  const { data: event } = await db.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const [{ data: needs }, { data: requests }, { data: quotes }, { data: bookings }, { data: vendors }] = await Promise.all([
    db.from("event_vendor_needs").select("*").eq("event_id", params.id),
    db.from("event_requests").select("*").eq("event_id", params.id),
    db.from("quotes").select("*").eq("event_id", params.id),
    db.from("bookings").select("*").eq("event_id", params.id),
    db.from("vendors").select("id,business_name"),
  ]);

  const names = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor.business_name]));
  const rows = (needs ?? []).filter((need) => need.status !== "dismissed").map((need) => {
    const booking = (bookings ?? []).find((item) => item.category === need.category && item.status !== "cancelled");
    const quote = (quotes ?? []).find((item) => item.category === need.category && item.status !== "declined" && item.status !== "expired");
    const request = (requests ?? []).find((item) => item.category === need.category);
    let status: Status = need.status === "searching" ? "searching" : "needed";
    let detail: string | undefined;
    if (booking) {
      status = booking.status === "pending_deposit" ? "payment" : "booked";
      detail = typeof booking.vendor_id === "string" ? names.get(booking.vendor_id) : undefined;
    } else if (quote) {
      status = "quote";
      detail = typeof quote.vendor_id === "string" ? names.get(quote.vendor_id) : undefined;
    } else if (request) {
      status = "inquired";
      detail = typeof request.vendor_id === "string" ? names.get(request.vendor_id) : undefined;
    }
    return { ...need, status, detail };
  });
  const booked = rows.filter((row) => row.status === "booked").length;

  return <div className="space-y-7">
    <EventWorkspaceHeader event={event} active="/vendors" eyebrow="Vendor Needs" />

    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="fleora-kicker">Source it</p>
        <h1 className="mt-1 font-display text-4xl">Find My Vendors</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">Build your event team from your Party Plan choices, or add any service you want to explore.</p>
      </div>
      <ButtonLink href={`/events/${event.id}/summary`} variant="secondary">View Party Plan Summary</ButtonLink>
    </div>

    <Card variant="feature" className="border-plum-100 bg-brand-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-plum-700"><StoreIcon size={21} /></span>
        <div>
          <p className="fleora-kicker">Add a vendor need</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900">What else would you like to find?</h2>
          <p className="mt-1 text-sm text-ink-600">Choose any event service. Fleora will add it to this list and show you matching vendors.</p>
        </div>
      </div>
      <form action={addVendorNeed.bind(null, event.id)} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Select name="category" required defaultValue="" aria-label="Vendor service" className="flex-1">
          <option value="" disabled>Search event services</option>
          {CATEGORY_GROUPS.map((group) => <optgroup key={group.key} label={group.label}>
            {CATEGORIES.filter((category) => category.group === group.key).map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
          </optgroup>)}
        </Select>
        <Button type="submit" className="shrink-0">Add &amp; find vendors</Button>
      </form>
    </Card>

    <div className="grid gap-4 sm:grid-cols-3">
      <Card><p className="text-xs font-bold uppercase text-ink-400">Vendor needs</p><p className="mt-1 font-display text-3xl">{rows.length}</p></Card>
      <Card><p className="text-xs font-bold uppercase text-ink-400">Still sourcing</p><p className="mt-1 font-display text-3xl">{rows.length - booked}</p></Card>
      <Card><p className="text-xs font-bold uppercase text-ink-400">Booked</p><p className="mt-1 font-display text-3xl">{booked}</p></Card>
    </div>

    {rows.length === 0 ? <Empty title="No vendor needs yet">
      <p>Add a service above or mark <b>Hire someone</b> inside My Party Plan.</p>
    </Empty> : <div className="space-y-4">
      <div><p className="fleora-kicker">Your sourcing list</p><h2 className="mt-1 font-display text-3xl">What your party needs</h2></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => <Card key={row.id} variant="interactive">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl">{row.label || categoryLabel(row.category)}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-ink-400">{categoryLabel(row.category)}</p>
              {row.detail && <p className="mt-2 text-sm text-ink-600">{row.detail}</p>}
            </div>
            <Badge tone={tone(row.status)}>{statusText(row.status)}</Badge>
          </div>
          {row.notes && <p className="mt-3 rounded-xl bg-plum-50 px-3 py-2 text-sm">{row.notes}</p>}
          <div className="mt-4 border-t fleora-divider pt-4">
            {row.status === "booked" ? <Link href={`/events/${event.id}/summary`} className="inline-flex items-center gap-1 text-sm font-semibold text-plum-700">View in Party Plan <ChevronRightIcon size={14} /></Link>
              : row.status === "inquired" || row.status === "quote" || row.status === "payment" ? <Link href="/messages" className="inline-flex items-center gap-1 text-sm font-semibold text-plum-700">Continue with vendor <ChevronRightIcon size={14} /></Link>
              : <Link href={`/events/${event.id}/matches/${row.category}`} className="inline-flex items-center gap-1 text-sm font-semibold text-plum-700">Find matching vendors <ChevronRightIcon size={14} /></Link>}
          </div>
        </Card>)}
      </div>
    </div>}
  </div>;
}
