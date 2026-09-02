import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { categoryEmoji, categoryLabel } from "@/lib/constants";
import { acceptQuote, declineQuote } from "../actions";

const statusTone = {
  sent: "plum",
  accepted: "green",
  declined: "rose",
  expired: "slate",
} as const;

export default async function QuotePage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", params.id).single();
  if (!quote) notFound();

  const [{ data: items }, { data: vendor }, { data: event }] = await Promise.all([
    supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("sort"),
    supabase.from("vendors").select("id,business_name,location").eq("id", quote.vendor_id).single(),
    supabase.from("events").select("id,name,client_id,event_date").eq("id", quote.event_id).single(),
  ]);

  const isClient = profile.id === event?.client_id;
  const canDecide = isClient && quote.status === "sent";

  const accept = acceptQuote.bind(null, quote.id);
  const decline = declineQuote.bind(null, quote.id);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title={`Quote from ${vendor?.business_name ?? "vendor"}`}
        subtitle={`${categoryEmoji(quote.category)} ${categoryLabel(quote.category)} · for ${
          event?.name ?? "your event"
        }`}
        action={<Badge tone={statusTone[quote.status]}>{quote.status}</Badge>}
      />

      <Card className="space-y-4">
        <ul className="divide-y divide-plum-50">
          {(items ?? []).map((it) => (
            <li key={it.id} className="flex justify-between py-2 text-sm">
              <span className="text-slate-700">{it.label}</span>
              <span className="text-slate-800">{money(it.amount)}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-1 border-t border-plum-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{money(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Deposit to book</span>
            <span>{money(quote.deposit)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{money(quote.total)}</span>
          </div>
        </div>

        {quote.notes && (
          <p className="rounded-lg bg-plum-50 p-3 text-sm text-slate-600">{quote.notes}</p>
        )}
        {quote.expires_at && (
          <p className="text-xs text-slate-400">Valid until {shortDate(quote.expires_at)}</p>
        )}

        {canDecide ? (
          <div className="flex gap-2">
            <form action={accept} className="flex-1">
              <Button type="submit" size="lg" className="w-full">
                Accept &amp; book
              </Button>
            </form>
            <form action={decline}>
              <Button type="submit" variant="secondary" size="lg">
                Decline
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {quote.status === "accepted"
              ? "You've accepted this quote — it's on your event dashboard."
              : quote.status === "declined"
                ? "This quote was declined."
                : "This quote is no longer actionable."}
          </p>
        )}
      </Card>

      {event && (
        <p className="mt-4 text-center text-sm">
          <Link href={`/events/${event.id}`} className="text-plum-700 hover:underline">
            ← Back to {event.name}
          </Link>
        </p>
      )}
    </div>
  );
}
