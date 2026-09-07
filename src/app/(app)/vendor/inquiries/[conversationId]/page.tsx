import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { categoryLabel, EVENT_TYPE_MAP } from "@/lib/constants";
import { money, shortDate } from "@/lib/format";

export default async function VendorInquiryDetail({params}:{params:{conversationId:string}}){
 const {vendor}=await requireVendor(); if(!vendor) redirect("/vendor/onboarding"); const supabase=createClient();
 const {data:convo}=await supabase.from("conversations").select("*").eq("id",params.conversationId).single();
 if(!convo||convo.vendor_id!==vendor.id) notFound();
 const [{data:event},{data:requests},{data:myCats},{data:quotes},{data:bookings},{data:messages},{data:planItems},{data:moodPhotos}] = await Promise.all([
  supabase.from("events").select("*").eq("id",convo.event_id).single(),
  supabase.from("event_requests").select("category").eq("event_id",convo.event_id),
  supabase.from("vendor_categories").select("category").eq("vendor_id",vendor.id),
  supabase.from("quotes").select("id,status,total,deposit").eq("vendor_id",vendor.id).eq("event_id",convo.event_id).order("created_at",{ascending:false}).limit(1),
  supabase.from("bookings").select("id,status,total").eq("vendor_id",vendor.id).eq("event_id",convo.event_id).order("created_at",{ascending:false}).limit(1),
  supabase.from("messages").select("id,body,created_at,sender_id").eq("conversation_id",convo.id).order("created_at",{ascending:true}),
  supabase.from("event_plan_items").select("id,label,choice,vendor_category,notes,chapter").eq("event_id",convo.event_id),
  supabase.from("event_inspiration_photos").select("id,url,sort").eq("event_id",convo.event_id).order("sort",{ascending:true}).limit(6),
 ]);
 const myCatSet=new Set((myCats??[]).map(c=>c.category)); const requested=(requests??[]).map(r=>r.category).filter(c=>myCatSet.has(c));
 const relevant=(planItems??[]).filter(i=>i.choice==="hire"&&i.vendor_category&&myCatSet.has(i.vendor_category));
 const planIds=relevant.map(i=>i.id); const {data:itemPhotos}=planIds.length?await supabase.from("event_plan_item_photos").select("id,url,plan_item_id,sort").in("plan_item_id",planIds).order("sort",{ascending:true}):{data:[] as any[]};
 const photos=[...(itemPhotos??[]),...(moodPhotos??[])].filter((p,i,a)=>a.findIndex(x=>x.url===p.url)===i).slice(0,8);
 const quote=quotes?.[0]; const booking=bookings?.[0]; const eventType=EVENT_TYPE_MAP[String(event?.event_type)]?.label??String(event?.event_type??"Event");
 const firstClientMessage=(messages??[]).find(m=>m.sender_id!==vendor.user_id)?.body;
 return <div className="mx-auto max-w-6xl">
  <Link href="/vendor/leads" className="mb-5 inline-flex text-sm font-semibold text-plum-700 hover:underline">← Back to inquiries</Link>
  <PageHeader title={`${eventType} inquiry`} subtitle="Everything the client has shared for this request — in one place."/>
  <div className="mb-6 flex flex-wrap gap-2">{booking?<Badge tone="green">Booked</Badge>:quote?<Badge tone="plum">Quote {quote.status}</Badge>:<Badge tone="amber">New inquiry</Badge>}{requested.map(c=><Badge key={c} tone="champagne">{categoryLabel(c)}</Badge>)}</div>
  <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
   <div className="space-y-6">
    <Card padding="lg"><p className="fleora-kicker">Event brief</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Mini label="Event type" value={eventType}/><Mini label="Date" value={shortDate(event?.event_date)}/><Mini label="Location" value={event?.location??"TBD"}/><Mini label="Guest count" value={String(event?.guest_count??"TBD")}/><Mini label="Overall event budget" value={money(event?.budget)}/><Mini label="Style / vision" value={event?.style??"Not specified"}/></div>{event?.colors&&<div className="mt-4 border-t border-plum-100 pt-4"><Mini label="Colors" value={event.colors}/></div>}</Card>
    {relevant.length>0&&<Card padding="lg"><p className="fleora-kicker">What they need from you</p><div className="mt-4 space-y-3">{relevant.map(i=><div key={i.id} className="rounded-2xl bg-ivory-100 p-4"><p className="font-semibold text-ink-900">{i.label}</p>{i.notes?<p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">{i.notes}</p>:<p className="mt-1 text-sm text-ink-400">No additional notes yet.</p>}</div>)}</div></Card>}
    {photos.length>0&&<Card padding="lg"><p className="fleora-kicker">Client inspiration</p><p className="mt-1 text-sm text-ink-600">Visual references from their Party Plan.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map(p=><div key={p.id} className="relative aspect-square overflow-hidden rounded-2xl bg-plum-50"><Image src={p.url} alt="Client inspiration" fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw"/></div>)}</div></Card>}
    <Card padding="lg"><p className="fleora-kicker">Client message</p>{firstClientMessage?<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{firstClientMessage}</p>:<p className="mt-3 text-sm text-ink-500">Open the conversation to see and respond to the client.</p>}</Card>
   </div>
   <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
    <Card variant="feature" padding="lg"><p className="fleora-kicker">Next step</p><h2 className="mt-1 font-display text-2xl text-ink-900">Turn this inquiry into a booking</h2><p className="mt-2 text-sm leading-relaxed text-ink-600">Ask questions in Messages or send a clear quote when you have enough detail.</p><div className="mt-5 grid gap-2"><ButtonLink href={`/messages/${convo.id}`} variant="secondary">Message client</ButtonLink>{!quote?<ButtonLink href={`/vendor/quote/${convo.id}`}>Create quote →</ButtonLink>:<ButtonLink href={`/vendor/quote/${convo.id}`}>View quote →</ButtonLink>}</div></Card>
    {quote&&<Card padding="lg"><p className="fleora-kicker">Quote status</p><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-sm text-ink-500">Your quote</p><p className="font-display text-3xl text-ink-900">{money(quote.total)}</p></div><Badge tone={quote.status==="accepted"?"green":quote.status==="declined"?"rose":"plum"}>{quote.status}</Badge></div>{booking&&<div className="mt-4 border-t border-plum-100 pt-4"><p className="text-sm font-semibold text-emerald-700">This inquiry became a booking.</p></div>}</Card>}
   </aside>
  </div>
 </div>;
}
function Mini({label,value}:{label:string;value:string}){return <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p><p className="mt-1 font-medium text-ink-900">{value}</p></div>}
