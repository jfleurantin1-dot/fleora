import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, PageHeader, Progress, StatCard } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { WalletIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const tone = (status:string) => status === "paid" ? "green" : status === "failed" || status === "cancelled" ? "rose" : status.includes("refund") ? "blush" : "amber";
const label = (type:string) => type === "deposit" ? "Deposit" : type === "balance" ? "Balance" : "Full payment";

export default async function ClientPaymentsPage(){
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: payments } = await supabase.from("payments").select("*").eq("client_id", profile.id).order("created_at", { ascending:false });
  const rows = payments ?? [];
  const eventIds=[...new Set(rows.map(p=>p.event_id))];
  const vendorIds=[...new Set(rows.map(p=>p.vendor_id))];
  const bookingIds=[...new Set(rows.map(p=>p.booking_id).filter(Boolean))] as string[];
  const [{data:events},{data:vendors},{data:bookings}] = await Promise.all([
    eventIds.length ? supabase.from("events").select("id,name,event_date,status").in("id",eventIds) : Promise.resolve({data:[]}),
    vendorIds.length ? supabase.from("vendors").select("id,business_name").in("id",vendorIds) : Promise.resolve({data:[]}),
    bookingIds.length ? supabase.from("bookings").select("id,total,balance,status,event_id,vendor_id").in("id",bookingIds) : Promise.resolve({data:[]}),
  ]);
  const eMap=new Map<string, any>((events??[]).map((e:any)=>[e.id,e])); const vMap=new Map<string, any>((vendors??[]).map((v:any)=>[v.id,v]));
  const paid=rows.filter(p=>p.status==="paid").reduce((s,p)=>s+Number(p.amount),0);
  const outstanding=(bookings??[]).reduce((s,b)=>s+Math.max(0,Number(b.balance??0)),0);
  const committed=(bookings??[]).reduce((s,b)=>s+Number(b.total??0),0);
  const paidCount=rows.filter(p=>p.status==="paid").length;
  const pct=committed>0?Math.min(100,Math.round((paid/committed)*100)):0;
  const byEvent = eventIds.map(id=>{
    const event=eMap.get(id); const eventPayments=rows.filter(p=>p.event_id===id); const eventBookings=(bookings??[]).filter(b=>b.event_id===id);
    return {id,event,paid:eventPayments.filter(p=>p.status==="paid").reduce((s,p)=>s+Number(p.amount),0),total:eventBookings.reduce((s,b)=>s+Number(b.total),0),remaining:eventBookings.reduce((s,b)=>s+Number(b.balance),0)};
  }).sort((a,b)=>String(a.event?.event_date??"9999").localeCompare(String(b.event?.event_date??"9999")));

  return <div>
    <PageHeader title="Fleora Pay" subtitle="See what you’ve paid, what’s still due, and every vendor payment for your events." />
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Paid" value={money(paid)} meta={`${paidCount} successful payment${paidCount===1?"":"s"}`} icon="✓" />
      <StatCard label="Remaining" value={money(outstanding)} meta="Across confirmed bookings" icon="$" />
      <StatCard label="Vendor commitments" value={money(committed)} meta={`${pct}% paid so far`} icon={<WalletIcon size={18}/>} />
    </div>

    {committed>0 && <Card variant="soft" className="mt-5"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-ink-700">Overall payment progress</span><span className="font-bold text-plum-700">{pct}%</span></div><div className="mt-3"><Progress value={pct}/></div></Card>}

    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between"><div><p className="fleora-kicker">By event</p><h2 className="font-display text-2xl text-ink-900">Event payment plans</h2></div></div>
      {byEvent.length===0 ? <Empty title="No Fleora Pay activity yet">Once you accept a quote and start a payment, your event balances will appear here.</Empty> : <div className="grid gap-3 md:grid-cols-2">{byEvent.map(x=><Card key={x.id} variant="interactive">
        <div className="flex items-start justify-between gap-4"><div><p className="font-bold text-ink-900">{x.event?.name??"Event"}</p><p className="mt-1 text-xs text-ink-500">{shortDate(x.event?.event_date)}</p></div><Badge tone={x.remaining<=0?"green":"amber"}>{x.remaining<=0?"Paid in full":"Balance due"}</Badge></div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-ivory-50 p-3 text-center"><div><p className="text-[10px] uppercase tracking-wide text-ink-400">Total</p><p className="mt-1 text-sm font-bold">{money(x.total)}</p></div><div><p className="text-[10px] uppercase tracking-wide text-ink-400">Paid</p><p className="mt-1 text-sm font-bold text-sage-700">{money(x.paid)}</p></div><div><p className="text-[10px] uppercase tracking-wide text-ink-400">Remaining</p><p className="mt-1 text-sm font-bold text-[#9B5065]">{money(x.remaining)}</p></div></div>
        <Link href={`/events/${x.id}/payments`} className="mt-4 inline-flex text-sm font-bold text-plum-700 hover:underline">View event payments →</Link>
      </Card>)}</div>}
    </section>

    <section className="mt-8">
      <div className="mb-3"><p className="fleora-kicker">History</p><h2 className="font-display text-2xl text-ink-900">Recent transactions</h2></div>
      {rows.length===0 ? <Empty title="No transactions yet"/> : <div className="space-y-3">{rows.slice(0,30).map(p=><Card key={p.id} variant="interactive" className="flex flex-wrap items-center justify-between gap-4">
        <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-ink-900">{vMap.get(p.vendor_id)?.business_name??"Vendor"}</p><Badge tone={tone(p.status) as any}>{p.status.replaceAll("_"," ")}</Badge></div><p className="mt-1 text-sm text-ink-600">{eMap.get(p.event_id)?.name??"Event"} · {label(p.payment_type)} · {shortDate(p.paid_at??p.created_at)}</p></div>
        <div className="flex items-center gap-4"><strong className="text-lg text-ink-900">{money(p.amount)}</strong><ButtonLink href={`/payments/${p.id}`} variant="secondary" size="sm">Details</ButtonLink></div>
      </Card>)}</div>}
    </section>
  </div>;
}
