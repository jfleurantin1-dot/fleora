import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHeader, StatCard } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { WalletIcon, CardIcon, StoreIcon } from "@/components/icons";
import { retrievePlatformBalance, stripeMode } from "@/lib/stripe-checkout";
import { refundPayment } from "./actions";

export const dynamic = "force-dynamic";

function centsForCurrency(rows: Array<{ amount: number; currency: string }> | undefined, currency = "usd") {
  return (rows ?? []).filter((r) => r.currency === currency).reduce((sum, r) => sum + Number(r.amount || 0), 0) / 100;
}

export default async function RevenuePage() {
  const profile = await requireProfile("/admin/revenue");
  if (profile.account_type !== "admin") redirect("/dashboard");

  const supabase = createClient();
  const [{ data: payments }, { data: settings }] = await Promise.all([
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("payment_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const rows = payments ?? [];
  const paidRows = rows.filter((p) => p.status === "paid" || p.status === "partially_refunded" || p.status === "refunded");
  const successfulVolume = paidRows.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const grossFees = paidRows.reduce((sum, p) => sum + Number(p.platform_fee ?? 0), 0);
  const refunded = rows.reduce((sum, p) => sum + Number(p.refunded_amount ?? 0), 0);
  const paidVendorNet = paidRows.reduce((sum, p) => sum + Number(p.vendor_net ?? 0), 0);
  const feePercent = Number(settings?.platform_fee_bps ?? 800) / 100;

  let available: number | null = null;
  let pending: number | null = null;
  let stripeError: string | null = null;
  try {
    const balance = await retrievePlatformBalance();
    available = centsForCurrency(balance.available);
    pending = centsForCurrency(balance.pending);
  } catch (error) {
    stripeError = error instanceof Error ? error.message : "Stripe balance could not be loaded.";
  }

  const eventIds = [...new Set(rows.map((p) => p.event_id).filter(Boolean))];
  const vendorIds = [...new Set(rows.map((p) => p.vendor_id).filter(Boolean))];
  const clientIds = [...new Set(rows.map((p) => p.client_id).filter(Boolean))];
  const [{ data: events }, { data: vendors }, { data: clients }] = await Promise.all([
    eventIds.length ? supabase.from("events").select("id,name").in("id", eventIds) : Promise.resolve({ data: [] }),
    vendorIds.length ? supabase.from("vendors").select("id,business_name").in("id", vendorIds) : Promise.resolve({ data: [] }),
    clientIds.length ? supabase.from("profiles").select("id,first_name,last_name").in("id", clientIds) : Promise.resolve({ data: [] }),
  ]);
  const eMap = new Map((events ?? []).map((e: any) => [e.id, e.name]));
  const vMap = new Map((vendors ?? []).map((v: any) => [v.id, v.business_name]));
  const cMap = new Map((clients ?? []).map((c: any) => [c.id, [c.first_name, c.last_name].filter(Boolean).join(" ") || "Client"]));
  const mode = stripeMode();
  const stripeBalanceUrl = mode === "live" ? "https://dashboard.stripe.com/balance/overview" : "https://dashboard.stripe.com/test/balance/overview";
  const stripePayoutUrl = mode === "live" ? "https://dashboard.stripe.com/settings/payouts" : "https://dashboard.stripe.com/test/settings/payouts";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fleora revenue"
        subtitle="Your owner view of payment volume, Fleora fees, vendor earnings, and the money currently sitting in your Stripe platform account."
        action={<Link href="/admin" className="inline-flex min-h-12 items-center rounded-xl border border-plum-200 bg-white px-4 text-sm font-semibold text-plum-700">← Admin</Link>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={mode === "live" ? "green" : "amber"}>{mode === "live" ? "LIVE MONEY" : "STRIPE SANDBOX"}</Badge>
        <span className="text-sm text-ink-500">Current Fleora marketplace fee: <strong className="text-ink-800">{feePercent}%</strong></span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Payment volume" value={money(successfulVolume)} meta="Successful Fleora Pay charges" icon={<CardIcon size={19}/>} />
        <StatCard label="Fleora fees earned" value={money(grossFees)} meta="Gross platform fees before Stripe costs/refunds" icon={<WalletIcon size={19}/>} />
        <StatCard label="Vendor share" value={money(paidVendorNet)} meta="Tracked vendor earnings" icon={<StoreIcon size={19}/>} />
        <StatCard label="Refunded" value={money(refunded)} meta="Refunds recorded in Fleora" icon="↩" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg" className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="fleora-kicker">Your Stripe balance</p><h2 className="mt-1 font-display text-2xl text-ink-900">Money available to Fleora</h2></div>
            <Badge tone={stripeError ? "rose" : "green"}>{stripeError ? "Needs attention" : "Connected"}</Badge>
          </div>
          {stripeError ? (
            <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm leading-relaxed text-rose-700">{stripeError}</p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-sage-100/70 p-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-500">Available</p><p className="mt-2 font-display text-3xl text-sage-700">{money(available ?? 0)}</p><p className="mt-1 text-xs text-ink-500">Eligible for Stripe payout</p></div>
              <div className="rounded-2xl bg-ivory-100 p-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-500">Pending</p><p className="mt-2 font-display text-3xl text-ink-900">{money(pending ?? 0)}</p><p className="mt-1 text-xs text-ink-500">Still settling in Stripe</p></div>
            </div>
          )}
          <p className="mt-5 text-xs leading-relaxed text-ink-500">This Stripe balance is different from “Fleora fees earned.” Stripe processing costs, refunds, disputes, and settlement timing can change the amount actually available for payout.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={stripeBalanceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-plum-600 px-4 text-sm font-semibold text-white">Open Stripe balance</a>
            <a href={stripePayoutUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-plum-200 bg-white px-4 text-sm font-semibold text-plum-700">Manage bank & payouts</a>
          </div>
        </Card>

        <Card variant="soft" padding="lg">
          <p className="fleora-kicker">How you get paid</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900">From client payment to your bank</h2>
          <div className="mt-5 space-y-3 text-sm text-ink-700">
            <div className="rounded-2xl bg-white p-4 shadow-sm"><strong>1. Client pays through Fleora</strong><p className="mt-1 text-ink-500">Stripe processes the charge.</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><strong>2. Fleora takes {feePercent}%</strong><p className="mt-1 text-ink-500">The vendor share is routed to the connected vendor account while Fleora’s application fee stays with your platform.</p></div>
            <div className="rounded-2xl bg-white p-4 shadow-sm"><strong>3. Stripe settles your balance</strong><p className="mt-1 text-ink-500">Once funds become available, Stripe pays them to the bank account attached to your Fleora platform account according to your payout schedule.</p></div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-500">You are currently looking at {mode === "live" ? "live" : "sandbox"} money. Sandbox balances are test funds and cannot be withdrawn.</p>
        </Card>
      </div>

      <section>
        <div className="mb-3"><p className="fleora-kicker">Revenue ledger</p><h2 className="font-display text-2xl text-ink-900">Every Fleora fee</h2></div>
        {rows.length === 0 ? <Empty title="No payments yet">Your platform fees will appear here as clients pay vendors through Fleora.</Empty> : (
          <div className="space-y-3">
            {rows.slice(0, 50).map((p: any) => (
              <Card key={p.id} variant="interactive" className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-ink-900">{vMap.get(p.vendor_id) ?? "Vendor"}</p><Badge tone={p.status === "paid" ? "green" : p.status === "failed" || p.status === "cancelled" ? "rose" : "amber"}>{String(p.status).replaceAll("_", " ")}</Badge></div>
                  <p className="mt-1 text-sm text-ink-600">{eMap.get(p.event_id) ?? "Event"} · {cMap.get(p.client_id) ?? "Client"} · {shortDate(p.paid_at ?? p.created_at)}</p>
                </div>
                <div className="space-y-3 sm:min-w-[300px]">
                  <div className="grid grid-cols-3 gap-5 text-right text-sm">
                    <div><p className="text-xs text-ink-400">Client paid</p><p className="mt-1 font-bold text-ink-900">{money(p.amount)}</p></div>
                    <div><p className="text-xs text-ink-400">Fleora cut</p><p className="mt-1 font-bold text-plum-700">{money(p.platform_fee)}</p></div>
                    <div><p className="text-xs text-ink-400">Vendor</p><p className="mt-1 font-bold text-sage-700">{money(p.vendor_net)}</p></div>
                  </div>
                  {Number(p.refunded_amount ?? 0) > 0 && <p className="text-right text-xs font-semibold text-rose-600">Refunded {money(p.refunded_amount)}</p>}
                  {["paid","partially_refunded"].includes(p.status) && p.stripe_payment_intent_id && <form action={refundPayment} className="flex justify-end"><input type="hidden" name="payment_id" value={p.id}/><button type="submit" className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Refund remaining payment</button></form>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
