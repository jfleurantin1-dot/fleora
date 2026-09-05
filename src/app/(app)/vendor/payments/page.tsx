import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { stripeConfigured } from "@/lib/stripe-rest";
import { Badge, Button, Card, Empty, PageHeader, StatCard } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { startStripeOnboarding, refreshStripeStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorPaymentsPage() {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");
  const supabase = createClient();
  const [{ data: settings }, { data: payments }] = await Promise.all([
    supabase.from("payment_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("payments").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const rows=payments??[];
  const eventIds=[...new Set(rows.map(p=>p.event_id))];
  const clientIds=[...new Set(rows.map(p=>p.client_id))];
  const [{data:events},{data:clients}] = await Promise.all([
    eventIds.length?supabase.from("events").select("id,name,event_date").in("id",eventIds):Promise.resolve({data:[]}),
    clientIds.length?supabase.from("profiles").select("id,first_name,last_name").in("id",clientIds):Promise.resolve({data:[]}),
  ]);
  const eMap=new Map<string, any>((events??[]).map((e:any)=>[e.id,e])); const cMap=new Map<string, string>((clients??[]).map((c:any)=>[c.id,[c.first_name,c.last_name].filter(Boolean).join(" ")||"Client"]));
  const paidRows=rows.filter(p=>p.status==="paid");
  const gross=paidRows.reduce((s,p)=>s+Number(p.amount),0); const fees=paidRows.reduce((s,p)=>s+Number(p.platform_fee),0); const net=paidRows.reduce((s,p)=>s+Number(p.vendor_net),0);
  const pending=rows.filter(p=>p.status==="pending"||p.status==="processing").reduce((s,p)=>s+Number(p.vendor_net),0);
  const feePercent=Number(settings?.platform_fee_bps??800)/100;
  const ready=vendor.stripe_onboarding_status==="ready" || (vendor.stripe_payouts_enabled && vendor.stripe_transfers_status==="active");
  const started=Boolean(vendor.stripe_account_id);

  return <div>
    <PageHeader title="Payments & payouts" subtitle="Track Fleora bookings, marketplace fees, and what your business earns." />
    <div className="grid gap-3 sm:grid-cols-4">
      <StatCard label="Client payments" value={money(gross)} meta="Successful payments" icon="$"/>
      <StatCard label="Fleora fees" value={money(fees)} meta={`${feePercent}% marketplace fee`} icon="%"/>
      <StatCard label="Your earnings" value={money(net)} meta="Routed through Stripe" icon="✓"/>
      <StatCard label="Processing" value={money(pending)} meta="Not confirmed yet" icon="…"/>
    </div>

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <Card padding="lg" className={ready?"border-sage-100 bg-sage-50/30":""}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="fleora-kicker">Stripe Connect</p><h2 className="mt-1 font-display text-2xl text-ink-900">{ready?"Stripe Connected":"Set up vendor payouts"}</h2></div><Badge tone={ready?"green":started?"amber":"plum"}>{ready?"Payouts ready":started?"Setup incomplete":"Not connected"}</Badge></div>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">Stripe securely handles your identity and payout details. Fleora never stores your bank account or card numbers.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Status label="Account" done={started}/><Status label="Business details" done={Boolean(vendor.stripe_details_submitted)}/><Status label="Payouts" done={ready}/></div>
        {ready ? <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-ink-700 shadow-sm"><strong className="text-sage-700">✓ Your payout setup is complete.</strong><p className="mt-1 text-ink-500">No further action is needed to receive eligible Fleora payments.</p></div> : <div className="mt-6 flex flex-wrap gap-3"><form action={startStripeOnboarding}><Button disabled={!stripeConfigured()}>{started?"Continue Stripe setup":"Connect with Stripe"}</Button></form>{started&&stripeConfigured()&&<form action={refreshStripeStatus}><Button variant="secondary">Refresh status</Button></form>}</div>}
      </Card>
      <Card variant="soft" padding="lg"><p className="fleora-kicker">Your numbers</p><h2 className="mt-1 font-display text-2xl text-ink-900">How each payment is split</h2><div className="mt-5 rounded-2xl bg-white p-4 shadow-sm"><div className="flex justify-between text-sm"><span className="text-ink-600">Example client payment</span><strong>{money(1000)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-ink-600">Fleora fee ({feePercent}%)</span><span>-{money(1000*feePercent/100)}</span></div><div className="mt-3 flex justify-between border-t border-[#EEE8F2] pt-3"><strong>Your share</strong><strong className="text-sage-700">{money(1000*(1-feePercent/100))}</strong></div></div><p className="mt-4 text-xs leading-relaxed text-ink-500">This dashboard shows Fleora’s marketplace fee. Stripe processing, tax, dispute, and refund handling will be finalized in Pay 1D before live launch.</p></Card>
    </div>

    <section className="mt-8"><div className="mb-3"><p className="fleora-kicker">History</p><h2 className="font-display text-2xl text-ink-900">Recent Fleora Pay activity</h2></div>
      {rows.length===0?<Empty title="No payments yet">When a client pays a deposit, balance, or full quote, it will appear here.</Empty>:<div className="space-y-3">{rows.map(p=><Card key={p.id} variant="interactive" className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-ink-900">{eMap.get(p.event_id)?.name??"Event"}</p><Badge tone={p.status==="paid"?"green":p.status==="failed"?"rose":"amber"}>{p.status.replaceAll("_"," ")}</Badge></div><p className="mt-1 text-sm text-ink-600">{cMap.get(p.client_id)??"Client"} · {p.payment_type==="deposit"?"Deposit":p.payment_type==="balance"?"Balance":"Full payment"} · {shortDate(p.paid_at??p.created_at)}</p></div><div className="text-right"><p className="font-display text-xl text-ink-900">{money(p.amount)}</p><p className="mt-1 text-xs text-ink-500">Your share {money(p.vendor_net)}</p></div></Card>)}</div>}
    </section>
  </div>;
}
function Status({label,done}:{label:string;done:boolean}){return <div className={`rounded-2xl px-4 py-3 ${done?"bg-sage-100/70":"bg-ivory-100"}`}><p className="text-xs font-semibold text-ink-500">{label}</p><p className={`mt-1 text-sm font-bold ${done?"text-sage-700":"text-ink-500"}`}>{done?"✓ Complete":"○ Pending"}</p></div>}
