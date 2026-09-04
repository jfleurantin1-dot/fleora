import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, PageHeader, StatCard } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function VendorLeads(){
 const {vendor}=await requireVendor(); if(!vendor) redirect("/vendor/onboarding"); const supabase=createClient();
 const {data:convos}=await supabase.from("conversations").select("*").eq("vendor_id",vendor.id).order("created_at",{ascending:false}); const list=convos??[];
 const eventIds=[...new Set(list.map(c=>c.event_id))];
 const [{data:events},{data:quotes},{data:bookings}] = await Promise.all([
  supabase.from("events").select("id,name,event_date,location,guest_count,budget,style").in("id",eventIds.length?eventIds:["00000000-0000-0000-0000-000000000000"]),
  supabase.from("quotes").select("id,event_id,status,total,deposit,expires_at").eq("vendor_id",vendor.id),
  supabase.from("bookings").select("id,event_id,status,total").eq("vendor_id",vendor.id),
 ]);
 type EventBrief=NonNullable<typeof events>[number]; const eventMap=new Map<string,EventBrief>(); for(const e of events??[]) eventMap.set(e.id,e);
 const quoteByEvent=new Map<string,NonNullable<typeof quotes>[number]>(); for(const q of quotes??[]) quoteByEvent.set(q.event_id,q);
 const bookingByEvent=new Map<string,NonNullable<typeof bookings>[number]>(); for(const b of bookings??[]) bookingByEvent.set(b.event_id,b);
 const needsQuote=list.filter(c=>!quoteByEvent.has(c.event_id)); const quoted=list.filter(c=>quoteByEvent.has(c.event_id)&&!bookingByEvent.has(c.event_id)); const booked=list.filter(c=>bookingByEvent.has(c.event_id));
 return <div className="mx-auto max-w-6xl"><PageHeader title="Lead center" subtitle="Turn inquiries into bookings. Every lead includes the event details you need to respond with confidence." action={<ButtonLink href="/messages" variant="secondary" size="sm">Messages</ButtonLink>}/>
 <div className="mb-8 grid gap-3 sm:grid-cols-3"><StatCard label="Needs response" value={needsQuote.length} meta="No quote sent yet" icon="✉"/><StatCard label="Quotes out" value={quoted.length} meta="Waiting on clients" icon="↗"/><StatCard label="Won" value={booked.length} meta="Converted to bookings" icon="✓"/></div>
 {!list.length?<Empty title="No leads yet">When a client reaches out about an event, the opportunity will appear here with their date, location, guest count and budget.</Empty>:<div className="space-y-8">
  <LeadSection title="Needs your response" subtitle="Start here — these clients are waiting to hear from you." conversations={needsQuote} eventMap={eventMap} quoteByEvent={quoteByEvent} bookingByEvent={bookingByEvent}/>
  <LeadSection title="Quotes sent" subtitle="You’ve responded. Keep the conversation moving." conversations={quoted} eventMap={eventMap} quoteByEvent={quoteByEvent} bookingByEvent={bookingByEvent}/>
  <LeadSection title="Booked" subtitle="Leads that became real Fleora bookings." conversations={booked} eventMap={eventMap} quoteByEvent={quoteByEvent} bookingByEvent={bookingByEvent}/>
 </div>}
 </div>;
}

type LeadConversation={id:string;event_id:string};
type LeadEvent={name:string|null;event_date:string|null;location:string|null;guest_count:number|null;budget:number|null;style:string|null};
type LeadQuote={status:string;total:number};
type LeadBooking={status:string;total:number};
function LeadSection({title,subtitle,conversations,eventMap,quoteByEvent,bookingByEvent}:{title:string;subtitle:string;conversations:LeadConversation[];eventMap:Map<string,LeadEvent>;quoteByEvent:Map<string,LeadQuote>;bookingByEvent:Map<string,LeadBooking>}){
 if(!conversations.length)return null;
 return <section><div className="mb-3"><h2 className="font-display text-2xl text-ink-900">{title}</h2><p className="mt-1 text-sm text-ink-600">{subtitle}</p></div><ul className="grid gap-4 lg:grid-cols-2">{conversations.map(c=>{const e=eventMap.get(c.event_id);const q=quoteByEvent.get(c.event_id);const b=bookingByEvent.get(c.event_id);return <Card as="li" key={c.id} variant="interactive" className="flex h-full flex-col justify-between gap-5"><div><div className="flex items-start justify-between gap-3"><div><p className="fleora-kicker">{b?"Booked client":q?"Quote sent":"New inquiry"}</p><h3 className="mt-1 font-display text-2xl text-ink-900">{e?.name??"Event inquiry"}</h3></div>{b?<Badge tone="green">Booked</Badge>:q?<Badge tone={q.status==="declined"?"rose":q.status==="accepted"?"green":"plum"}>quote {q.status}</Badge>:<Badge tone="amber">Needs quote</Badge>}</div><div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-ivory-100 p-4 text-sm"><Mini label="Date" value={shortDate(e?.event_date)}/><Mini label="Guests" value={String(e?.guest_count??"?")}/><Mini label="Location" value={e?.location??"TBD"}/><Mini label="Client budget" value={money(e?.budget)}/></div>{e?.style&&<div className="mt-3"><Badge tone="plum">{e.style}</Badge></div>}{q&&<div className="mt-4 flex items-center justify-between rounded-2xl border border-plum-100 bg-plum-50/50 p-3"><span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Your quote</span><span className="font-semibold text-plum-700">{money(q.total)}</span></div>}</div><div className="flex flex-wrap gap-2"><ButtonLink href={`/messages/${c.id}`} size="sm" variant="secondary" className="flex-1">Message client</ButtonLink>{!q&&<ButtonLink href={`/vendor/quote/${c.id}`} size="sm" className="flex-1">Send quote</ButtonLink>}{q&&!b&&<ButtonLink href={`/vendor/quote/${c.id}`} size="sm" variant="ghost" className="flex-1">View quote</ButtonLink>}</div></Card>})}</ul></section>;
}
function Mini({label,value}:{label:string;value:string}){return <div><p className="text-xs text-ink-400">{label}</p><p className="font-medium text-ink-900">{value}</p></div>}
