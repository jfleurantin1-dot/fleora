import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function VendorLeads(){
 const {vendor}=await requireVendor(); if(!vendor) redirect("/vendor/onboarding"); const supabase=createClient();
 const {data:convos}=await supabase.from("conversations").select("*").eq("vendor_id",vendor.id).order("created_at",{ascending:false}); const list=convos??[];
 const eventIds=[...new Set(list.map(c=>c.event_id))];
 const [{data:events},{data:quotes}] = await Promise.all([
  supabase.from("events").select("id,name,event_date,location,guest_count,budget,style").in("id",eventIds.length?eventIds:["00000000-0000-0000-0000-000000000000"]),
  supabase.from("quotes").select("event_id,status,total").eq("vendor_id",vendor.id),
 ]);
 type EventBrief=NonNullable<typeof events>[number]; const eventMap=new Map<string,EventBrief>(); for(const e of events??[]) eventMap.set(e.id,e); const quoteByEvent=new Map<string,{status:string;total:number}>(); for(const q of quotes??[]) quoteByEvent.set(q.event_id,q);
 return <div className="mx-auto max-w-5xl"><PageHeader title="Leads" subtitle="Every inquiry arrives with the event details you need to decide if it’s a fit." />
 {!list.length?<Empty title="No leads yet">When a client requests a quote from you, their event brief will appear here.</Empty>:<ul className="grid gap-4 lg:grid-cols-2">{list.map(c=>{const e=eventMap.get(c.event_id); const q=quoteByEvent.get(c.event_id); return <Card as="li" key={c.id} variant="interactive" className="flex h-full flex-col justify-between gap-5"><div><div className="flex items-start justify-between gap-3"><div><p className="fleora-kicker">Client inquiry</p><h2 className="mt-1 font-display text-2xl text-ink-900">{e?.name}</h2></div>{q?<Badge tone={q.status==="accepted"?"green":q.status==="declined"?"rose":"plum"}>quote {q.status}</Badge>:<Badge tone="amber">Needs quote</Badge>}</div><div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-ivory-100 p-4 text-sm"><div><p className="text-xs text-ink-400">Date</p><p className="font-medium text-ink-900">{shortDate(e?.event_date)}</p></div><div><p className="text-xs text-ink-400">Guests</p><p className="font-medium text-ink-900">{e?.guest_count??"?"}</p></div><div><p className="text-xs text-ink-400">Location</p><p className="font-medium text-ink-900">{e?.location??"TBD"}</p></div><div><p className="text-xs text-ink-400">Budget</p><p className="font-medium text-ink-900">{money(e?.budget)}</p></div></div>{e?.style&&<div className="mt-3"><Badge tone="plum">{e.style}</Badge></div>}</div><div className="flex gap-2"><ButtonLink href={`/messages/${c.id}`} size="sm" variant="secondary" className="flex-1">Message</ButtonLink>{!q&&<ButtonLink href={`/vendor/quote/${c.id}`} size="sm" className="flex-1">Create quote</ButtonLink>}{q&&<span className="flex flex-1 items-center justify-end text-sm font-semibold text-ink-600">{money(q.total)}</span>}</div></Card>})}</ul>}
 </div>;
}
