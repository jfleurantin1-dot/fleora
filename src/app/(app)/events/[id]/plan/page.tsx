import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Progress } from "@/components/ui";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";
import { SparkleIcon, ImageFrameIcon, UtensilsIcon, StoreIcon, MusicIcon, MapPinIcon, ChevronRightIcon } from "@/components/icons";

export default async function PartyPlanPage({ params }: { params: { id: string } }) {
  await requireProfile(); const supabase=createClient();
  const {data:event}=await supabase.from("events").select("*").eq("id",params.id).single(); if(!event) notFound();
  const [{data:photos},{data:requests},{data:planItems}]=await Promise.all([
    supabase.from("event_inspiration_photos").select("id").eq("event_id",params.id),
    supabase.from("event_requests").select("id").eq("event_id",params.id),
    supabase.from("event_plan_items").select("chapter,item_key,choice").eq("event_id",params.id),
  ]);
  const decorItems=(planItems??[]).filter(item=>item.chapter==="decor");
  const decorDecided=decorItems.filter(item=>item.choice!=="undecided").length;
  const chapters=[
    {title:"Vision",desc:"Theme, colors, mood board and Party Blueprints.",icon:<ImageFrameIcon size={23}/>,status:(photos??[]).length?"Started":"Start here",href:`/events/${event.id}/edit`,live:true},
    {title:"Decor",desc:"Backdrops, tablescapes, signs, florals, favors and rentals.",icon:<SparkleIcon size={23}/>,status:decorItems.length?`${decorDecided}/${decorItems.length} decided`:"Plan decor",href:`/events/${event.id}/plan/decor`,live:true},
    {title:"Food & Drinks",desc:"Potluck, catering, chefs, food trucks, drinks and bartenders.",icon:<UtensilsIcon size={23}/>,status:"Coming soon",href:"#",live:false},
    {title:"Services",desc:"Photography, coordination, staffing, cleanup and more.",icon:<StoreIcon size={23}/>,status:(requests??[]).length?"Started":"Plan services",href:`/events/${event.id}/services`,live:true},
    {title:"Entertainment",desc:"DJ, photo booth, performers, kids entertainment and activities.",icon:<MusicIcon size={23}/>,status:"Coming soon",href:"#",live:false},
    {title:"Venue & Logistics",desc:"Venue needs, access, parking, setup, cleanup and important notes.",icon:<MapPinIcon size={23}/>,status:"Coming soon",href:"#",live:false},
  ];
  const started=(photos??[]).length?1:0;
  const decorProgress=decorItems.length ? decorDecided/decorItems.length : 0;
  const servicesStarted=(requests??[]).length?1:0;
  const pct=Math.round(((started+decorProgress+servicesStarted)/chapters.length)*100);
  return <div className="space-y-7">
    <EventWorkspaceHeader event={event} active="/plan" eyebrow="My Party Plan"/>
    <Card variant="feature" className="overflow-hidden bg-gradient-to-br from-plum-50 via-white to-blush-50">
      <p className="fleora-kicker">Dream it → plan it</p><h1 className="mt-2 font-display text-4xl text-ink-900">Build your party, chapter by chapter.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">Tell Fleora what you want to DIY, what you already have, and what you want to hire. Your choices will eventually become shopping items, tasks and vendor needs automatically.</p>
      <div className="mt-6 max-w-xl"><div className="mb-2 flex justify-between text-xs font-semibold text-ink-500"><span>Party Plan progress</span><span>{pct}%</span></div><Progress value={pct}/></div>
    </Card>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {chapters.map((c,i)=><Card key={c.title} variant="interactive" className="flex min-h-[210px] flex-col">
        <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-50 text-plum-700">{c.icon}</span><span className="text-xs font-bold text-ink-400">Chapter {i+1}</span></div>
        <h2 className="mt-4 font-display text-2xl text-ink-900">{c.title}</h2><p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{c.desc}</p>
        {c.live?<Link href={c.href} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-plum-700 hover:underline">{c.status}<ChevronRightIcon size={14}/></Link>:<span className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-400">{c.status}</span>}
      </Card>)}
    </div>
  </div>;
}
