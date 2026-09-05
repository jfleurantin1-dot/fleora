import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { accountState, retrieveConnectedAccount, stripeConfigured } from "@/lib/stripe-rest";
import { Badge, Button, Card, Empty, PageHeader, Progress, StatCard } from "@/components/ui";
import { money } from "@/lib/format";
import { startStripeOnboarding, refreshStripeStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorPaymentsPage({ searchParams }: { searchParams?: { stripe?: string } }) {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");
  const supabase = createClient();

  let live = {
    onboardingStatus: vendor.stripe_onboarding_status ?? "not_started",
    detailsSubmitted: Boolean(vendor.stripe_details_submitted),
    payoutsEnabled: Boolean(vendor.stripe_payouts_enabled),
    transfersStatus: vendor.stripe_transfers_status ?? null,
  };

  if (stripeConfigured() && vendor.stripe_account_id && searchParams?.stripe === "return") {
    try {
      const account = await retrieveConnectedAccount(vendor.stripe_account_id);
      const state = accountState(account);
      live = state;
      const admin = createAdminClient();
      await admin.from("vendors").update({
        stripe_onboarding_status: state.onboardingStatus,
        stripe_details_submitted: state.detailsSubmitted,
        stripe_charges_enabled: state.chargesEnabled,
        stripe_payouts_enabled: state.payoutsEnabled,
        stripe_transfers_status: state.transfersStatus,
        stripe_last_synced_at: new Date().toISOString(),
      }).eq("id", vendor.id);
    } catch { /* keep last known state and show reconnect option */ }
  }

  const [{ data: settings }, { data: payments }] = await Promise.all([
    supabase.from("payment_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("payments").select("amount,platform_fee,vendor_net,status,created_at").eq("vendor_id", vendor.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const paid = (payments ?? []).filter(p => p.status === "paid");
  const gross = paid.reduce((sum, p) => sum + Number(p.amount), 0);
  const fees = paid.reduce((sum, p) => sum + Number(p.platform_fee), 0);
  const net = paid.reduce((sum, p) => sum + Number(p.vendor_net), 0);
  const feePercent = Number(settings?.platform_fee_bps ?? 800) / 100;
  const isReady = live.onboardingStatus === "ready";
  const hasStarted = Boolean(vendor.stripe_account_id);

  return <div>
    <PageHeader title="Payments & payouts" subtitle="Connect Stripe once, then Fleora can route client payments to your business and track every booking balance." />

    {!stripeConfigured() && <Card variant="feature" className="mb-6">
      <p className="fleora-kicker">Setup required</p>
      <h2 className="mt-1 font-display text-2xl text-ink-900">Stripe test mode isn’t connected to Fleora yet</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Add the Stripe test secret key to Vercel first. The Connect button stays intentionally disabled until the server has that key.</p>
    </Card>}

    <div className="mb-8 grid gap-3 sm:grid-cols-3">
      <StatCard label="Payments received" value={money(gross)} meta="Successful Fleora payments" icon="$" />
      <StatCard label="Fleora fees" value={money(fees)} meta={`${feePercent}% marketplace fee`} icon="%" />
      <StatCard label="Your earnings" value={money(net)} meta="Before your own taxes/expenses" icon="✓" />
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="fleora-kicker">Stripe Connect</p>
            <h2 className="mt-1 font-display text-3xl text-ink-900">{isReady ? "Ready to receive payouts" : hasStarted ? "Finish your payout setup" : "Connect your payout account"}</h2>
          </div>
          <Badge tone={isReady ? "green" : hasStarted ? "amber" : "plum"}>{isReady ? "Ready" : hasStarted ? "Setup incomplete" : "Not connected"}</Badge>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">Stripe securely collects your identity and bank details. Fleora never stores your bank account or card numbers.</p>

        <div className="mt-6 space-y-3">
          <StatusRow label="Stripe account created" done={hasStarted} />
          <StatusRow label="Business details submitted" done={live.detailsSubmitted} />
          <StatusRow label="Payout capability active" done={live.payoutsEnabled && live.transfersStatus === "active"} />
        </div>
        <div className="mt-5"><Progress value={isReady ? 100 : live.detailsSubmitted ? 70 : hasStarted ? 35 : 0} /></div>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={startStripeOnboarding}><Button disabled={!stripeConfigured()}>{isReady ? "Review Stripe setup" : hasStarted ? "Continue Stripe setup" : "Connect with Stripe"}</Button></form>
          {hasStarted && stripeConfigured() && <form action={refreshStripeStatus}><Button variant="secondary">Refresh status</Button></form>}
        </div>
      </Card>

      <Card variant="soft" padding="lg">
        <p className="fleora-kicker">How Fleora Pay works</p>
        <h2 className="mt-1 font-display text-2xl text-ink-900">Paid when clients book</h2>
        <div className="mt-5 space-y-4 text-sm text-ink-700">
          <Step n="1" title="Send a quote">Your normal Fleora quote starts the payment flow.</Step>
          <Step n="2" title="Client pays in Fleora">Pay 1B will support a deposit or payment in full.</Step>
          <Step n="3" title="Stripe routes your share">Fleora’s marketplace fee is calculated automatically and the remainder is routed to your connected account.</Step>
        </div>
        <div className="mt-6 rounded-2xl border border-[#E7DFED] bg-white p-4">
          <div className="flex justify-between text-sm"><span className="text-ink-600">Example booking</span><strong>{money(1000)}</strong></div>
          <div className="mt-2 flex justify-between text-sm"><span className="text-ink-600">Fleora fee ({feePercent}%)</span><span>-{money(1000 * feePercent / 100)}</span></div>
          <div className="mt-3 border-t border-[#EEE8F2] pt-3 flex justify-between"><strong>Your share</strong><strong className="text-emerald-700">{money(1000 * (1 - feePercent / 100))}</strong></div>
        </div>
      </Card>
    </div>

    <section className="mt-8">
      <h2 className="font-display text-2xl text-ink-900">Recent Fleora Pay activity</h2>
      <div className="mt-3"><Empty title="No payments yet">Once Pay 1B is live, deposits, balances, refunds and payout activity will appear here.</Empty></div>
    </section>
  </div>;
}

function StatusRow({ label, done }: { label: string; done: boolean }) {
  return <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${done ? "bg-emerald-50" : "bg-ivory-100"}`}><span className="font-medium text-ink-800">{label}</span><span className={done ? "font-semibold text-emerald-700" : "text-ink-400"}>{done ? "✓ Complete" : "○ Pending"}</span></div>;
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-plum-100 text-xs font-bold text-plum-700">{n}</span><div><p className="font-semibold text-ink-900">{title}</p><p className="mt-0.5 leading-relaxed text-ink-600">{children}</p></div></div>;
}
