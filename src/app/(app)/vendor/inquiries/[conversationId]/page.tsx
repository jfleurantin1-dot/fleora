import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { categoryLabel, EVENT_TYPE_MAP } from "@/lib/constants";
import { money, shortDate, timeRange } from "@/lib/format";
import { DeclineInquiry } from "./decline-inquiry";

function cleanClientMessage(body?:string|null){
 if(!body) return "";
 return body.split("\nInquiry summary:")[0].trim();
}

export default async function VendorInquiryDetail({params}:{params:{conversationId:string}}){
 const {vendor}=await requireVendor(); if(!vendor) redirect("/vendor/onboarding"); const supabase=createClient();
 const {data:convo}=await supabase.from("conversations").select("*").eq("id",params.conversationId).single();
 if(!convo||convo.vendor_id!==vendor.id) notFound();
 const [{data:event},{data:requests},{data:myCats},{data:quotes},{data:bookings},{data:messages},{data:moodPhotos}] = await Promise.all([
  supabase.from("events").select("*").eq("id",convo.event_id).single(),
  supabase.from("event_requests").select("category").eq("event_id",convo.event_id),
  supabase.from("vendor_categories").select("category").eq("vendor_id",vendor.id),
  supabase.from("quotes").select("id,status,total,deposit,category").eq("vendor_id",vendor.id).eq("event_id",convo.event_id).order("created_at",{ascending:false}).limit(1),
  supabase.from("bookings").select("id,status,total").eq("vendor_id",vendor.id).eq("event_id",convo.event_id).order("created_at",{ascending:false}).limit(1),
  supabase.from("messages").select("id,body,created_at,sender_id").eq("conversation_id",convo.id).order("created_at",{ascending:true}),
  supabase.from("event_inspiration_photos").select("id,url,sort").eq("event_id",convo.event_id).order("sort",{ascending:true}).limit(8),
 ]);
 const myCatSet=new Set((myCats??[]).map(c=>c.category));
 const requested=(requests??[]).map(r=>r.category).filter(c=>myCatSet.has(c));
 const inquiryCategory=String((convo as any).inquiry_category??requested[0]??"");
 const {data:needs}=inquiryCategory?await supabase.from("event_vendor_needs").select("id,plan_item_id,category,label,notes").eq("event_id",convo.event_id).eq("category",inquiryCategory):{data:[] as any[]};
 const planIds=(needs??[]).map(n=>n.plan_item_id).filter(Boolean);
 const {data:itemPhotos}=planIds.length?await supabase.from("event_plan_item_photos").select("id,url,plan_item_id,sort").in("plan_item_id",planIds).order("sort",{ascending:true}):{data:[] as any[]};
 const quote=quotes?.[0]; const booking=bookings?.[0];
 const vendorStatus=String((convo as any).vendor_inquiry_status??"active");
 const clientStatus=String((convo as any).client_inquiry_status??"active");
 const closed=vendorStatus==="declined"||clientStatus==="cancelled";
 const eventType=EVENT_TYPE_MAP[String(event?.event_type)]?.label??String(event?.event_type??"Event");
 const eventColors=typeof event?.color_palette==="string"?event.color_palette:(typeof (event as any)?.colors==="string"?(event as any).colors:"");
 const firstClientMessage=cleanClientMessage((messages??[]).find(m=>m.sender_id!==vendor.user_id)?.body);
 return <div className="mx-auto max-w-6xl">
  <Link href="/vendor/leads" className="mb-5 inline-flex text-sm font-semibold text-plum-700 hover:underline">← Back to inquiries</Link>
  <PageHeader title={`${eventType} inquiry`} subtitle="The event context, request details and client note — all in one place."/>
  <div className="mb-6 flex flex-wrap gap-2">{booking?<Badge tone="green">Booked</Badge>:clientStatus==="cancelled"?<Badge tone="rose">Cancelled by client</Badge>:vendorStatus==="declined"?<Badge tone="rose">Declined</Badge>:quote?<Badge tone="plum">Quote {quote.status}</Badge>:<Badge tone="amber">New inquiry</Badge>}{inquiryCategory&&<Badge tone="champagne">{categoryLabel(inquiryCategory)}</Badge>}</div>
  <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
   <div className="space-y-6">
    <Card padding="lg"><p className="fleora-kicker">Event brief</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Mini label="Event type" value={eventType}/><Mini label="Date" value={shortDate(event?.event_date)}/><Mini label="Time" value={timeRange((event as any)?.event_start_time,(event as any)?.event_end_time)}/><Mini label="Location" value={event?.location??"TBD"}/><Mini label="Guest count" value={String(event?.guest_count??"TBD")}/><Mini label="Overall event budget" value={money(event?.budget)}/><Mini label="Style / vision" value={event?.style??"Not specified"}/></div>{eventColors?<div className="mt-4 border-t border-plum-100 pt-4"><Mini label="Colors" value={eventColors}/></div>:null}</Card>
    {(moodPhotos??[]).length>0&&<Card padding="lg"><p className="fleora-kicker">Event mood board</p><p className="mt-1 text-sm text-ink-600">The overall look and feel the client is planning.</p><div className="mt-4 grid auto-rows-[110px] grid-cols-2 gap-3 sm:grid-cols-4">{(moodPhotos??[]).map((p,i)=><div key={p.id} className={`relative overflow-hidden rounded-2xl bg-plum-50 ${i===0?"col-span-2 row-span-2":""}`}><Image src={p.url} alt="Event mood board" fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw"/></div>)}</div></Card>}
    {(needs??[]).length>0&&<Card padding="lg"><p className="fleora-kicker">What they need from you</p><div className="mt-4 space-y-3">{(needs??[]).map(n=><div key={n.id} className="rounded-2xl bg-ivory-100 p-4"><p className="font-semibold text-ink-900">{n.label||categoryLabel(n.category)}</p>{n.notes?<p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">{n.notes}</p>:<p className="mt-1 text-sm text-ink-400">No additional planning notes yet.</p>}</div>)}</div></Card>}
    {(itemPhotos??[]).length>0&&<Card padding="lg"><p className="fleora-kicker">Inspiration for this request</p><p className="mt-1 text-sm text-ink-600">Reference photos attached specifically to this service.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{(itemPhotos??[]).map(p=><div key={p.id} className="relative aspect-square overflow-hidden rounded-2xl bg-plum-50"><Image src={p.url} alt="Request inspiration" fill className="object-cover" sizes="(max-width:640px) 50vw, 25vw"/></div>)}</div></Card>}
    <Card padding="lg"><p className="fleora-kicker">Client message</p>{firstClientMessage?<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{firstClientMessage}</p>:<p className="mt-3 text-sm text-ink-500">The client did not add a personal note.</p>}</Card>
   </div>
   <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
    <Card variant="feature" padding="lg"><p className="fleora-kicker">Next step</p><h2 className="mt-1 font-display text-2xl text-ink-900">Turn this inquiry into a booking</h2><p className="mt-2 text-sm leading-relaxed text-ink-600">Ask questions in Messages or send a clear quote when you have enough detail.</p><div className="mt-5 grid gap-2">{!closed?<><ButtonLink href={`/messages/${convo.id}?from=inquiry`} variant="secondary">Message client</ButtonLink>{!quote?<ButtonLink href={`/vendor/quote/${convo.id}?from=inquiry`}>Create quote →</ButtonLink>:<ButtonLink href={`/vendor/quote/${convo.id}?from=inquiry`}>View quote →</ButtonLink>}<DeclineInquiry conversationId={convo.id}/></>:clientStatus==="cancelled"?<div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Request cancelled by client</p><p className="mt-1">This inquiry is closed. The conversation remains available for your records.</p></div>:<div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Inquiry declined</p><p className="mt-1">This inquiry has been moved out of your active opportunities.</p></div>}</div></Card>
    {quote&&<Card padding="lg"><p className="fleora-kicker">Quote status</p><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-sm text-ink-500">Your quote</p><p className="font-display text-3xl text-ink-900">{money(quote.total)}</p></div><Badge tone={quote.status==="accepted"?"green":quote.status==="declined"?"rose":"plum"}>{quote.status}</Badge></div>{booking&&<div className="mt-4 border-t border-plum-100 pt-4"><p className="text-sm font-semibold text-emerald-700">This inquiry became a booking.</p></div>}</Card>}
   </aside>
  </div>
 </div>;
}
function Mini({label,value}:{label:string;value:string}){return <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p><p className="mt-1 font-medium text-ink-900">{value}</p></div>}
