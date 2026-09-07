import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";
import { categoryLabel } from "@/lib/constants";
import { shortDate } from "@/lib/format";
import { CheckIcon, ChevronRightIcon } from "@/components/icons";

type Tone = "green" | "plum" | "blush" | "slate" | "rose";
type SummaryStatus = { label: string; tone: Tone; detail?: string; href?: string };

const chapterLabel: Record<string,string> = { decor:"Decor", food_drinks:"Food & Drinks", services:"Services", entertainment:"Entertainment", venue_logistics:"Venue & Logistics" };

function statusFor(category:string, choice:string|undefined, bookings:any[], quotes:any[], requests:any[], vendors:Map<string,string>):SummaryStatus {
  const booking=bookings.find(b=>b.category===category && b.status!=="cancelled");
  if(booking){ const name=vendors.get(booking.vendor_id); return booking.status==="pending_deposit" ? {label:"Awaiting Payment",tone:"blush",detail:name} : {label:"Booked",tone:"green",detail:name}; }
  const sentQuotes=quotes.filter(q=>q.category===category && q.status==="sent");
  if(sentQuotes.length){ const q=sentQuotes[0]; return {label:"Quote Received",tone:"plum",detail:sentQuotes.length===1?vendors.get(q.vendor_id):`${sentQuotes.length} quotes`}; }
  const req=requests.find(r=>r.category===category);
  if(req){ if(req.status==="quoted") return {label:"Quote Received",tone:"plum"}; if(req.status==="booked") return {label:"Booked",tone:"green"}; return {label:"Searching",tone:"plum"}; }
  if(choice==="diy") return {label:"DIY",tone:"green"};
  if(choice==="existing") return {label:"Planned",tone:"green",detail:"Already have someone"};
  if(choice==="hire") return {label:"Searching",tone:"plum"};
  return {label:"TBD",tone:"slate"};
}

function Row({label,status,notes}:{label:string;status:SummaryStatus;notes?:string|null}){
  return <li className="flex flex-wrap items-start justify-between gap-3 py-2.5">
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-plum-400" aria-hidden="true"/>
      <div className="min-w-0"><p className="font-semibold text-ink-900">{label}{status.detail&&<span className="font-normal text-ink-600"> · {status.detail}</span>}</p>{notes&&<p className="mt-0.5 max-w-2xl text-xs text-ink-500">{notes}</p>}</div>
    </div>
    <Badge tone={status.tone}>{status.label}</Badge>
  </li>
}

export default async function PartyPlanSummary({params}:{params:{id:string}}){
  await requireProfile(); const s=createClient();
  const {data:event}=await s.from("events").select("*").eq("id",params.id).single(); if(!event)notFound();
  const [{data:planItems},{data:needs},{data:requests},{data:quotes},{data:bookings},{data:vendors},{data:guests},{data:potluck},{data:menu}]=await Promise.all([
    s.from("event_plan_items").select("*").eq("event_id",params.id).order("created_at"),
    s.from("event_vendor_needs").select("*").eq("event_id",params.id),
    s.from("event_requests").select("*").eq("event_id",params.id),
    s.from("quotes").select("*").eq("event_id",params.id).order("created_at",{ascending:false}),
    s.from("bookings").select("*").eq("event_id",params.id),
    s.from("vendors").select("id,business_name"),
    s.from("guests").select("rsvp,party_size").eq("event_id",params.id),
    s.from("event_potluck_items").select("id,assigned_to").eq("event_id",params.id),
    s.from("event_menu_items").select("name").eq("event_id",params.id).order("created_at"),
  ]);
  const vendorNames=new Map((vendors??[]).map(v=>[v.id,v.business_name]));
  const activeBookings=(bookings??[]).filter(b=>b.status!=="cancelled");
  const allCategories=new Set([...(requests??[]).map(r=>r.category),...(needs??[]).filter(n=>n.status!=="dismissed").map(n=>n.category),...activeBookings.map(b=>b.category)]);
  const planByCategory=new Map((planItems??[]).filter(p=>p.vendor_category).map(p=>[p.vendor_category,p]));
  const serviceRows=[...allCategories].filter(c=>!planByCategory.has(c) && c!=="venue");
  const groups=new Map<string,any[]>(); for(const item of planItems??[]){ if(item.chapter==="event_details") continue; groups.set(item.chapter,[...(groups.get(item.chapter)??[]),item]); }
  const invited=(guests??[]).reduce((n,g)=>n+Number(g.party_size??1),0); const attending=(guests??[]).filter(g=>g.rsvp==="yes").reduce((n,g)=>n+Number(g.party_size??1),0);
  const pending=(guests??[]).filter(g=>g.rsvp==="pending").length;
  const attention:any[]=[];
  for(const b of activeBookings.filter(b=>b.status==="pending_deposit")) attention.push({label:categoryLabel(b.category),text:`Payment needed${vendorNames.get(b.vendor_id)?` · ${vendorNames.get(b.vendor_id)}`:""}`,href:`/events/${event.id}/payments`});
  for(const q of (quotes??[]).filter(q=>q.status==="sent")) attention.push({label:categoryLabel(q.category),text:`Quote ready to review${vendorNames.get(q.vendor_id)?` · ${vendorNames.get(q.vendor_id)}`:""}`,href:`/quotes/${q.id}`});
  for(const p of (planItems??[]).filter(p=>p.choice==="undecided")) attention.push({label:p.label,text:"Decision needed",href:p.chapter==="food_drinks"?`/events/${event.id}/plan/food-drinks`:p.chapter==="services"?`/events/${event.id}/services`:p.chapter==="entertainment"?`/events/${event.id}/entertainment`:`/events/${event.id}/plan/decor`});
  const venueBooking=activeBookings.find(b=>b.category==="venue"); const venueStatus:SummaryStatus=venueBooking?statusFor("venue",undefined,activeBookings,quotes??[],requests??[],vendorNames):event.location_type==="home"?{label:"Planned",tone:"green",detail:event.location??"Home"}:event.needs_venue?{label:"Searching",tone:"plum",detail:event.location??"Venue needed"}:event.location_type==="venue"&&event.location?{label:"Planned",tone:"green",detail:event.location}:{label:"TBD",tone:"slate",detail:event.location??undefined};
  return <div className="space-y-7">
    <EventWorkspaceHeader event={event} active="/summary" eyebrow="Party Plan Summary"/>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="fleora-kicker">One-page event plan</p><h1 className="mt-1 font-display text-4xl text-ink-900">Everything you’ve planned, at a glance.</h1><p className="mt-2 max-w-2xl text-sm text-ink-600">Booked vendors, DIY decisions, open searches and TBDs all roll up here automatically as your party plan changes.</p></div><Link href={`/events/${event.id}/plan`} className="text-sm font-bold text-plum-700 hover:underline">Edit Party Plan →</Link></div>
    {attention.length>0&&<Card variant="feature" className="border-blush-200 bg-blush-50/60"><p className="fleora-kicker">Needs attention</p><h2 className="mt-1 font-display text-2xl text-ink-900">{attention.length} thing{attention.length===1?"":"s"} to keep moving</h2><div className="mt-3 divide-y fleora-divider">{attention.slice(0,5).map((a,i)=><Link key={`${a.label}-${i}`} href={a.href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-plum-700"><span><b>{a.label}</b> · {a.text}</span><ChevronRightIcon size={15}/></Link>)}</div></Card>}
    <Card><div className="flex items-center justify-between"><div><p className="fleora-kicker">Event Details & Vision</p><h2 className="mt-1 font-display text-2xl text-ink-900">{event.name}</h2></div><Badge tone="green"><span className="inline-flex items-center gap-1"><CheckIcon size={12}/> Planned</span></Badge></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-ink-400">Date</p><b>{event.event_date?shortDate(event.event_date):"TBD"}</b></div><div><p className="text-ink-400">Guests</p><b>{event.guest_count??"TBD"}</b></div><div><p className="text-ink-400">Style</p><b>{event.style||"TBD"}</b></div><div><p className="text-ink-400">Colors</p><b>{event.color_palette||"TBD"}</b></div></div><ul className="mt-3"><Row label="Location / Venue" status={venueStatus}/></ul></Card>
    {[...groups.entries()].map(([chapter,items])=><Card key={chapter}><h2 className="font-display text-2xl text-ink-900">{chapterLabel[chapter]??chapter.replaceAll("_"," ")}</h2><ul className="mt-3 space-y-0.5">{items.map(item=>{let st=statusFor(item.vendor_category??"",item.choice,activeBookings,quotes??[],requests??[],vendorNames); if((item.chapter==="services"||item.chapter==="entertainment")&&(item.choice==="diy"||item.choice==="existing")) st={label:"Planned",tone:"green",detail:item.item_key==="no_entertainment"||item.item_key==="no_services"?"None needed":"Already have someone"}; if(!item.vendor_category&&item.choice==="diy") st={label:"DIY",tone:"green"}; if(["no_decor","skip_food_drinks","no_services","no_entertainment"].includes(item.item_key)) st={label:"Complete",tone:"green",detail:item.item_key==="skip_food_drinks"?"Skipped in Fleora":"None needed"}; if(item.item_key==="potluck"){const assigned=(potluck??[]).filter(x=>x.assigned_to).length, open=(potluck??[]).length-assigned;st={label:"Planned",tone:"green",detail:`${assigned} assigned${open?` · ${open} still needed`:""}`}; } if(item.item_key==="catering"&&item.choice==="diy"&&(menu??[]).length)st={label:"DIY",tone:"green",detail:(menu??[]).map(m=>m.name).join(" · ")}; return <Row key={item.id} label={item.label} status={st} notes={item.notes}/>})}</ul></Card>)}
    {serviceRows.length>0&&<Card><p className="fleora-kicker">Vendors & Services</p><h2 className="mt-1 font-display text-2xl text-ink-900">Your event team</h2><ul className="mt-3 space-y-0.5">{serviceRows.map(c=><Row key={c} label={categoryLabel(c)} status={statusFor(c,undefined,activeBookings,quotes??[],requests??[],vendorNames)}/>)}</ul></Card>}
    <Card><p className="fleora-kicker">Guests</p><h2 className="mt-1 font-display text-2xl text-ink-900">RSVP snapshot</h2><p className="mt-3 text-sm text-ink-600"><b className="text-ink-900">{invited}</b> invited · <b className="text-ink-900">{attending}</b> attending · <b className="text-ink-900">{pending}</b> pending</p></Card>
    <p className="pb-4 text-center text-xs text-ink-400">This summary updates automatically as you plan, contact vendors, receive quotes and book.</p>
  </div>;
}
