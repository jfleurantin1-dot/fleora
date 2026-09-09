import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { shortDate } from "@/lib/format";

export default async function PlanningToolsPage(){
  const profile=await requireProfile("/planning");
  if(profile.account_type==="vendor")redirect("/vendor/dashboard");
  const supabase=createClient();
  const {data:events}=await supabase.from("events").select("id,name,event_date,location,status").eq("client_id",profile.id).order("event_date",{ascending:true});
  const active=(events??[]).filter((e)=>e.status!=="cancelled"&&e.status!=="completed");
  return <div className="space-y-7">
    <PageHeader title="Planning Tools" subtitle="Jump into your party plan, guest list, timeline, checklist and budget from one place." action={<ButtonLink href="/events/new" size="sm">+ New event</ButtonLink>}/>
    {!active.length?<Empty title="No active events yet"><p>Create an event first, then Fleora will organize all of your planning tools here.</p><div className="mt-4"><ButtonLink href="/events/new">Create an event</ButtonLink></div></Empty>:
    <div className="grid gap-4 lg:grid-cols-2">{active.map((event)=><Card key={event.id} className="space-y-4">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-2xl text-ink-900">{event.name}</h2><p className="mt-1 text-sm text-ink-500">{event.event_date?shortDate(event.event_date):"Date not set"}{event.location?` · ${event.location}`:""}</p></div><Badge tone="plum">{event.status}</Badge></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Link href={`/events/${event.id}/plan`} className="rounded-xl border border-plum-100 bg-plum-50/60 px-3 py-3 text-sm font-semibold text-plum-800 hover:bg-plum-100">Party Plan</Link>
        <Link href={`/events/${event.id}/guests`} className="rounded-xl border border-plum-100 bg-white px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-plum-50">Guest List</Link>
        <Link href={`/events/${event.id}/timeline`} className="rounded-xl border border-plum-100 bg-white px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-plum-50">Timeline</Link>
        <Link href={`/events/${event.id}/checklist`} className="rounded-xl border border-plum-100 bg-white px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-plum-50">Checklist</Link>
        <Link href={`/events/${event.id}/budget`} className="rounded-xl border border-plum-100 bg-white px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-plum-50">Budget</Link>
        <Link href={`/events/${event.id}/vendors`} className="rounded-xl border border-plum-100 bg-white px-3 py-3 text-sm font-semibold text-ink-700 hover:bg-plum-50">Vendor Needs</Link>
      </div>
    </Card>)}</div>}
  </div>;
}
