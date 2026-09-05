import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export const dynamic="force-dynamic";

export default async function PaymentDetail({params}:{params:{id:string}}){
 const profile=await requireProfile(); const supabase=createClient();
 const {data:p}=await supabase.from("payments").select("*").eq("id",params.id).single(); if(!p||p.client_id!==profile.id) notFound();
 const [{data:event},{data:vendor},{data:booking}] = await Promise.all([
   supabase.from("events").select("id,name,event_date").eq("id",p.event_id).single(),
   supabase.from("vendors").select("id,business_name").eq("id",p.vendor_id).single(),
   p.booking_id?supabase.from("bookings").select("id,total,balance,status,quote_id").eq("id",p.booking_id).single():Promise.resolve({data:null})
 ]);
 const title=p.payment_type==="deposit"?"Deposit payment":p.payment_type==="balance"?"Balance payment":"Full payment"; const paid=p.status==="paid";
 return <div className="mx-auto max-w-2xl"><PageHeader title="Payment details" subtitle={`${event?.name??"Event"} · ${vendor?.business_name??"Vendor"}`}/>
  <Card variant="feature" padding="lg"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="fleora-kicker">Fleora Pay</p><h2 className="mt-1 font-display text-3xl text-ink-900">{money(p.amount)}</h2><p className="mt-1 text-sm text-ink-600">{title}</p></div><Badge tone={paid?"green":p.status==="failed"?"rose":"amber"}>{p.status.replaceAll("_"," ")}</Badge></div>
  <div className="mt-6 divide-y divide-[#EEE8F2] rounded-2xl border border-[#EEE8F2] bg-white px-4"><Row label="Vendor" value={vendor?.business_name??"Vendor"}/><Row label="Event" value={event?.name??"Event"}/><Row label="Date" value={shortDate(p.paid_at??p.created_at)}/><Row label="Payment type" value={title}/><Row label="Booking balance" value={booking?money(booking.balance):"—"}/><Row label="Reference" value={p.id.slice(0,8).toUpperCase()}/></div>
  <div className="mt-6 flex flex-wrap gap-3">{p.receipt_url&&<a href={p.receipt_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-gradient-to-r from-plum-500 to-plum-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm">Open Stripe receipt</a>}<ButtonLink href={`/events/${p.event_id}/payments`} variant="secondary">Event payments</ButtonLink>{booking?.quote_id&&<ButtonLink href={`/quotes/${booking.quote_id}`} variant="ghost">View quote</ButtonLink>}</div>
  {!p.receipt_url&&paid&&<p className="mt-4 rounded-xl bg-ivory-100 px-4 py-3 text-xs leading-relaxed text-ink-500">Your payment is confirmed. Stripe receipt links are saved automatically for new payments after Pay 1C is deployed.</p>}
  </Card><p className="mt-5 text-center text-sm"><Link href="/payments" className="font-semibold text-plum-700 hover:underline">← Back to Fleora Pay</Link></p></div>
}
function Row({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-ink-500">{label}</span><span className="text-right font-semibold text-ink-900">{value}</span></div>}
