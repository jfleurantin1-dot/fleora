import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";
import { acceptQuote, declineQuote } from "../actions";

const statusTone={sent:"amber",accepted:"green",declined:"rose",expired:"slate"} as const;
export default async function QuotePage({params}:{params:{id:string}}){
 const profile=await requireProfile(); const supabase=createClient();
 const {data:quote}=await supabase.from("quotes").select("*").eq("id",params.id).single(); if(!quote) notFound();
 const [{data:items},{data:vendor},{data:event}] = await Promise.all([
  supabase.from("quote_items").select("*").eq("quote_id",quote.id).order("sort"),
  supabase.from("vendors").select("id,business_name,location").eq("id",quote.vendor_id).single(),
  supabase.from("events").select("id,name,client_id,event_date,location").eq("id",quote.event_id).single(),
 ]);
 const isClient=profile.id===event?.client_id; const canDecide=isClient&&quote.status==="sent"; const accept=acceptQuote.bind(null,quote.id); const decline=declineQuote.bind(null,quote.id);
 return <div className="mx-auto max-w-2xl">
  <PageHeader title={`Quote from ${vendor?.business_name??"vendor"}`} subtitle={`${categoryLabel(quote.category)} · ${event?.name??"your event"}`} action={<Badge tone={statusTone[quote.status]}>{quote.status}</Badge>}/>
  <Card variant="feature" padding="lg" className="overflow-hidden">
   <div className="mb-6 rounded-2xl bg-ivory-100 p-4"><p className="fleora-kicker">Event</p><p className="mt-1 font-semibold text-ink-900">{event?.name}</p><p className="mt-1 text-sm text-ink-600">{shortDate(event?.event_date)} · {event?.location??vendor?.location??"Location TBD"}</p></div>
   <div className="space-y-1">{(items??[]).map(it=><div key={it.id} className="flex items-center justify-between border-b border-[#F0EBEE] py-3 text-sm"><span className="text-ink-700">{it.label}</span><span className="font-medium text-ink-900">{money(it.amount)}</span></div>)}</div>
   <div className="mt-5 space-y-2 rounded-2xl bg-white p-4 ring-1 ring-[#E9E3E7]"><div className="flex justify-between text-sm text-ink-600"><span>Subtotal</span><span>{money(quote.subtotal)}</span></div><div className="flex justify-between text-sm text-ink-600"><span>Deposit to book</span><span>{money(quote.deposit)}</span></div><div className="mt-2 flex justify-between border-t border-[#E9E3E7] pt-3 text-lg font-semibold text-ink-900"><span>Total</span><span>{money(quote.total)}</span></div></div>
   {quote.notes&&<div className="mt-5 rounded-2xl bg-blush-50 p-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-plum-500">Vendor note</p><p className="mt-2 text-sm leading-relaxed text-ink-700">{quote.notes}</p></div>}
   {quote.expires_at&&<p className="mt-4 text-xs text-ink-400">Valid until {shortDate(quote.expires_at)}</p>}
   {canDecide?<div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]"><form action={accept}><Button type="submit" size="lg" className="w-full">Accept & book</Button></form><form action={decline}><Button type="submit" variant="secondary" size="lg" className="w-full">Decline</Button></form></div>:<p className="mt-6 rounded-xl bg-ivory-100 px-4 py-3 text-sm text-ink-600">{quote.status==="accepted"?"You accepted this quote. It is now connected to your event dashboard.":quote.status==="declined"?"This quote was declined.":"This quote is no longer actionable."}</p>}
  </Card>
  {event&&<p className="mt-5 text-center text-sm"><Link href={`/events/${event.id}`} className="font-semibold text-plum-700 hover:underline">← Back to {event.name}</Link></p>}
 </div>;
}
