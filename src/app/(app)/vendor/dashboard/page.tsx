import { redirect } from "next/navigation";
import Link from "next/link";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Empty, PageHeader, Progress, SectionHeader, StatCard, Stars, Card } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";

export default async function VendorDashboard(){
 const {vendor}=await requireVendor(); if(!vendor) redirect("/vendor/onboarding"); const supabase=createClient(); const today=new Date().toISOString().slice(0,10);
 const [{data:convos},{data:quotes},{data:bookings},{data:events},{data:categories},{data:photos},{data:services},{data:packages}] = await Promise.all([
  supabase.from("conversations").select("*").eq("vendor_id",vendor.id),
  supabase.from("quotes").select("id,event_id,status,total,category").eq("vendor_id",vendor.id),
  supabase.from("bookings").select("*").eq("vendor_id",vendor.id),
  supabase.from("events").select("id,name,event_date,location,guest_count,budget,style"),
  supabase.from("vendor_categories").select("category").eq("vendor_id",vendor.id),
  supabase.from("vendor_photos").select("id").eq("vendor_id",vendor.id),
  supabase.from("services").select("id").eq("vendor_id",vendor.id),
  supabase.from("packages").select("id").eq("vendor_id",vendor.id),
 ]);
 type EventBrief=NonNullable<typeof events>[number]; const eventMap=new Map<string,EventBrief>(); for(const e of events??[]) eventMap.set(e.id,e);
 const quotedEventIds=new Set((quotes??[]).map(q=>q.event_id)); const newLeads=(convos??[]).filter(c=>!quotedEventIds.has(c.event_id)); const activeBookings=(bookings??[]).filter(b=>b.status!=="cancelled"); const upcoming=activeBookings.filter(b=>{const d=eventMap.get(b.event_id)?.event_date;return d&&d>=today}); const upcomingRevenue=upcoming.reduce((s,b)=>s+Number(b.total),0);
 const checks=[
  {label:"Business description",done:Boolean(vendor.description),detail:"Tell clients what makes you different."},
  {label:"Service area",done:Boolean(vendor.location),detail:"Add your home base and coverage area."},
  {label:"Service categories",done:Boolean(categories?.length),detail:"Choose everything clients can hire you for."},
  {label:"Portfolio photos",done:Boolean(photos?.length),detail:"Show your best event work."},
  {label:"Services & pricing",done:Boolean(services?.length),detail:"Give clients a starting point for budget."},
  {label:"Website or Instagram",done:Boolean(vendor.website||vendor.instagram),detail:"Add a place clients can see more of your work."},
 ];
 const complete=checks.filter(c=>c.done).length; const completion=Math.round((complete/checks.length)*100);
 return <div>
  <PageHeader title={`Welcome, ${vendor.business_name}`} subtitle="Your Fleora business command center — leads, bookings, profile strength and next steps in one place." action={<ButtonLink href="/vendor/onboarding" variant="secondary" size="sm">Edit profile</ButtonLink>}/>
  <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="New leads" value={newLeads.length} meta="Need a response" icon="✉"/><StatCard label="Upcoming events" value={upcoming.length} meta="Active bookings" icon="◫"/><StatCard label="Upcoming revenue" value={money(upcomingRevenue)} meta="From active bookings" icon="$"/><StatCard label="Rating" value={<Stars rating={vendor.rating} count={vendor.review_count}/>} meta="Client feedback" icon="★"/></div>
  {newLeads.length>0&&<Card variant="feature" className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="fleora-kicker">Action needed</p><p className="mt-1 font-display text-2xl text-ink-900">You have {newLeads.length} lead{newLeads.length===1?"":"s"} waiting</p><p className="mt-1 text-sm text-ink-600">Review the event details, message the client, and send a quote while the opportunity is fresh.</p></div><ButtonLink href="/vendor/leads" size="sm">Review leads →</ButtonLink></Card>}
  <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
   <Card padding="lg"><div className="flex items-start justify-between gap-4"><div><p className="fleora-kicker">Profile strength</p><h2 className="mt-1 font-display text-2xl text-ink-900">Make your storefront booking-ready</h2></div><span className="text-xl font-semibold text-plum-700">{completion}%</span></div><div className="mt-4"><Progress value={completion}/></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{checks.map(c=><div key={c.label} className={`rounded-2xl p-3 ${c.done?"bg-emerald-50":"bg-ivory-100"}`}><div className="flex gap-2"><span className={c.done?"text-emerald-600":"text-ink-400"}>{c.done?"✓":"○"}</span><div><p className="text-sm font-semibold text-ink-900">{c.label}</p><p className="mt-0.5 text-xs leading-relaxed text-ink-500">{c.detail}</p></div></div></div>)}</div><div className="mt-4"><ButtonLink href="/vendor/onboarding" variant="secondary" size="sm">Complete my profile</ButtonLink></div></Card>
   <Card variant="soft" padding="lg"><p className="fleora-kicker">Quick actions</p><h2 className="mt-1 font-display text-2xl text-ink-900">Run your business</h2><div className="mt-5 grid gap-2"><ButtonLink href="/vendor/leads" variant="secondary" className="justify-between">Review leads <span>→</span></ButtonLink><ButtonLink href="/messages" variant="secondary" className="justify-between">Open messages <span>→</span></ButtonLink><ButtonLink href="/vendor/onboarding" variant="secondary" className="justify-between">Update services & portfolio <span>→</span></ButtonLink><ButtonLink href="/vendor/availability" variant="secondary" className="justify-between">Manage availability <span>→</span></ButtonLink><ButtonLink href="/vendor/claim" variant="ghost" className="justify-between">Find & claim another profile <span>→</span></ButtonLink></div>{packages?.length? <p className="mt-4 text-xs text-ink-500">{packages.length} package{packages.length===1?"":"s"} currently on your profile.</p>:null}</Card>
  </div>
  <div className="grid gap-8 lg:grid-cols-2"><section><SectionHeader title="New leads" description="Fresh inquiries that still need a quote." action={<Link href="/vendor/leads" className="text-sm font-semibold text-plum-700">View all →</Link>}/>{!newLeads.length?<Empty title="You’re caught up">New client inquiries will appear here.</Empty>:<ul className="space-y-3">{newLeads.slice(0,4).map(c=>{const e=eventMap.get(c.event_id); return <Card as="li" key={c.id} variant="interactive" padding="none"><Link href={`/vendor/quote/${c.id}`} className="block p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink-900">{e?.name??"New event inquiry"}</p><p className="mt-1 text-sm text-ink-600">{shortDate(e?.event_date)} · {e?.location??"TBD"} · {e?.guest_count??"?"} guests</p></div><Badge tone="amber">Needs quote</Badge></div><div className="mt-3 flex flex-wrap gap-2">{e?.style&&<Badge tone="plum">{e.style}</Badge>}<Badge tone="champagne">{money(e?.budget)} budget</Badge></div></Link></Card>})}</ul>}</section>
  <section><SectionHeader title="Upcoming bookings" description="Your next confirmed celebrations."/>{!upcoming.length?<Empty title="Nothing booked yet">Accepted quotes will turn into upcoming bookings here.</Empty>:<ul className="space-y-3">{upcoming.slice(0,4).map(b=>{const e=eventMap.get(b.event_id); return <Card as="li" key={b.id} className="flex items-center justify-between gap-4"><div><p className="font-semibold text-ink-900">{e?.name}</p><p className="mt-1 text-sm text-ink-600">{categoryLabel(b.category)} · {shortDate(e?.event_date)} · {money(b.total)}</p></div><Badge tone={b.status==="confirmed"?"green":"amber"}>{b.status.replace("_"," ")}</Badge></Card>})}</ul>}</section></div>
 </div>;
}
