import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, PageHeader, Progress, StatCard } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export const dynamic="force-dynamic";

export default async function EventPayments({params}:{params:{id:string}}){
 const profile=await requireProfile(); const supabase=createClient();
 const {data:event}=await supabase.from("events").select("id,name,event_date,client_id").eq("id",params.id).single();
 if(!event||event.client_id!==profile.id) notFound();
 const [{data:payments},{data:bookings}]=await Promise.all([
   supabase.from("payments").select("*").eq("event_id",event.id).order("created_at",{ascending:false}),
   supabase.from("bookings").select("*").eq("event_id",event.id).order("created_at",{ascending:true})
 ]);
 const vendorIds=[...new Set([...(payments??[]).map(p=>p.vendor_id),...(bookings??[]).map(b=>b.vendor_id)])];
 const {data:vendors}=vendorIds.length?await supabase.from("vendors").select("id,business_name").in("id",vendorIds):{data:[]}; const vMap=new Map((vendors??[]).map(v=>[v.id,v.business_name]));
 const total=(bookings??[]).reduce((s,b)=>s+Number(b.total),0); const remaining=(bookings??[]).reduce((s,b)=>s+Math.max(0,Number(b.balance)),0); const paid=Math.max(0,total-remaining); const pct=total?Math.round((paid/total)*100):0;
 return <div>
   <PageHeader title={`${event.name} payments`} subtitle={`${shortDate(event.event_date)} · Keep every vendor balance in one place.`} action={<ButtonLink href={`/events/${event.id}`} variant="secondary" size="sm">Back to event</ButtonLink>}/>
   <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Vendor total" value={money(total)} meta={`${(bookings??[]).length} booking${(bookings??[]).length===1?"":"s"}`} icon="$"/><StatCard label="Paid" value={money(paid)} meta={`${pct}% complete`} icon="✓"/><StatCard label="Remaining" value={money(remaining)} meta={remaining>0?"Outstanding balance":"All vendors paid"} icon="→"/></div>
   {total>0&&<Card variant="soft" className="mt-5"><div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-ink-700">Payment progress</span><span className="font-bold text-plum-700">{pct}%</span></div><Progress value={pct}/></Card>}
   <section className="mt-8"><div className="mb-3"><p className="fleora-kicker">Your vendors</p><h2 className="font-display text-2xl text-ink-900">Balances</h2></div>
   {(bookings??[]).length===0?<Empty title="No confirmed vendor payments yet">Accept a vendor quote to start a Fleora Pay balance.</Empty>:<div className="space-y-3">{(bookings??[]).map(b=>{const bp=(payments??[]).filter(p=>p.booking_id===b.id);const paidAmt=bp.filter(p=>p.status==="paid").reduce((s,p)=>s+Number(p.amount),0);return <Card key={b.id} variant="interactive">
     <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold text-ink-900">{vMap.get(b.vendor_id)??"Vendor"}</p><p className="mt-1 text-sm text-ink-600">{money(paidAmt)} paid · {money(b.balance)} remaining</p></div><Badge tone={Number(b.balance)<=0?"green":"amber"}>{Number(b.balance)<=0?"Paid in full":"Balance due"}</Badge></div>
     <div className="mt-4"><Progress value={Number(b.total)>0?Math.round((paidAmt/Number(b.total))*100):0}/></div>
     <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-ink-500">Booking total <strong className="text-ink-900">{money(b.total)}</strong></span><Link href={`/quotes/${b.quote_id}`} className="text-sm font-bold text-plum-700 hover:underline">View quote / pay balance →</Link></div>
   </Card>})}</div>}
   </section>
   <section className="mt-8"><div className="mb-3"><p className="fleora-kicker">Transactions</p><h2 className="font-display text-2xl text-ink-900">Payment history</h2></div>{(payments??[]).length===0?<Empty title="No transactions yet"/>:<div className="space-y-3">{(payments??[]).map(p=><Card key={p.id} className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-semibold text-ink-900">{vMap.get(p.vendor_id)??"Vendor"} · {p.payment_type==="deposit"?"Deposit":p.payment_type==="balance"?"Balance":"Full payment"}</p><p className="mt-1 text-xs text-ink-500">{shortDate(p.paid_at??p.created_at)} · {p.status.replaceAll("_"," ")}</p></div><div className="flex items-center gap-4"><strong>{money(p.amount)}</strong><ButtonLink href={`/payments/${p.id}`} variant="secondary" size="sm">Details</ButtonLink></div></Card>)}</div>}</section>
 </div>
}
