import { redirect } from "next/navigation";
import Link from "next/link";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Empty, PageHeader, SectionHeader, StatCard, Stars, Card } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";

export default async function VendorDashboard(){
 const {vendor}=await requireVendor(); if(!vendor) redirect("/vendor/onboarding"); const supabase=createClient(); const today=new Date().toISOString().slice(0,10);
 const [{data:convos},{data:quotes},{data:bookings},{data:events}] = await Promise.all([
  supabase.from("conversations").select("*").eq("vendor_id",vendor.id), supabase.from("quotes").select("id,event_id,status,total,category").eq("vendor_id",vendor.id), supabase.from("bookings").select("*").eq("vendor_id",vendor.id), supabase.from("events").select("id,name,event_date,location,guest_count,budget,style")]);
 type EventBrief=NonNullable<typeof events>[number]; const eventMap=new Map<string,EventBrief>(); for(const e of events??[]) eventMap.set(e.id,e);
 const quotedEventIds=new Set((quotes??[]).map(q=>q.event_id)); const newLeads=(convos??[]).filter(c=>!quotedEventIds.has(c.event_id)); const activeBookings=(bookings??[]).filter(b=>b.status!=="cancelled"); const upcoming=activeBookings.filter(b=>{const d=eventMap.get(b.event_id)?.event_date;return d&&d>=today}); const upcomingRevenue=upcoming.reduce((s,b)=>s+Number(b.total),0);
 return <div>
  <PageHeader title={`Good morning, ${vendor.business_name} ✨`} subtitle={vendor.status==="approved"?"Here’s what’s happening with your Fleora business.":"Finish your profile while Fleora reviews your business."} action={<ButtonLink href="/vendor/onboarding" variant="secondary" size="sm">Edit profile</ButtonLink>}/>
  <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="New leads" value={newLeads.length} meta="Waiting for a response" icon="✉"/><StatCard label="Upcoming events" value={upcoming.length} meta="Confirmed bookings" icon="◫"/><StatCard label="Upcoming revenue" value={money(upcomingRevenue)} meta="From active bookings" icon="$"/><StatCard label="Rating" value={<Stars rating={vendor.rating} count={vendor.review_count}/>} meta="Client feedback" icon="★"/></div>
  {vendor.status!=="approved"&&<Card variant="soft" className="mb-8 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-ink-900">Your profile is under review</p><p className="mt-1 text-sm text-ink-600">You can keep polishing your services and portfolio while you wait.</p></div><Badge tone="amber">Pending approval</Badge></Card>}
  <div className="grid gap-8 lg:grid-cols-2"><section><SectionHeader title="New leads" description="Fresh inquiries that still need a quote." action={<Link href="/vendor/leads" className="text-sm font-semibold text-plum-700">View all →</Link>}/>{!newLeads.length?<Empty title="No new leads right now"/>:<ul className="space-y-3">{newLeads.slice(0,4).map(c=>{const e=eventMap.get(c.event_id); return <Card as="li" key={c.id} variant="interactive" padding="none"><Link href={`/messages/${c.id}`} className="block p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink-900">{e?.name}</p><p className="mt-1 text-sm text-ink-600">{shortDate(e?.event_date)} · {e?.location??"TBD"} · {e?.guest_count??"?"} guests</p></div><span className="text-plum-300">›</span></div><div className="mt-3 flex flex-wrap gap-2">{e?.style&&<Badge tone="plum">{e.style}</Badge>}<Badge tone="champagne">{money(e?.budget)} budget</Badge></div></Link></Card>})}</ul>}</section>
  <section><SectionHeader title="Upcoming bookings" description="Your next confirmed celebrations."/>{!upcoming.length?<Empty title="Nothing booked yet"/>:<ul className="space-y-3">{upcoming.slice(0,4).map(b=>{const e=eventMap.get(b.event_id); return <Card as="li" key={b.id} className="flex items-center justify-between gap-4"><div><p className="font-semibold text-ink-900">{e?.name}</p><p className="mt-1 text-sm text-ink-600">{categoryLabel(b.category)} · {shortDate(e?.event_date)} · {money(b.total)}</p></div><Badge tone={b.status==="confirmed"?"green":"amber"}>{b.status.replace("_"," ")}</Badge></Card>})}</ul>}</section></div>
 </div>;
}
