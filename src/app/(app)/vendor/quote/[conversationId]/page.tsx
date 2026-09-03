import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireVendor } from "@/lib/auth";
import { Badge, Card, PageHeader } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { QuoteForm } from "./quote-form";

export default async function ComposeQuotePage({params}:{params:{conversationId:string}}){
 const {vendor}=await requireVendor(); if(!vendor) redirect("/vendor/onboarding"); const supabase=createClient();
 const {data:convo}=await supabase.from("conversations").select("*").eq("id",params.conversationId).single(); if(!convo||convo.vendor_id!==vendor.id) notFound();
 const [{data:event},{data:requests},{data:myCats}] = await Promise.all([supabase.from("events").select("*").eq("id",convo.event_id).single(),supabase.from("event_requests").select("category").eq("event_id",convo.event_id),supabase.from("vendor_categories").select("category").eq("vendor_id",vendor.id)]);
 const myCatSet=new Set((myCats??[]).map(c=>c.category)); const overlap=(requests??[]).map(r=>r.category).filter(c=>myCatSet.has(c)); const categories=overlap.length?overlap:[...myCatSet];
 return <div className="mx-auto max-w-2xl"><Link href={`/messages/${params.conversationId}`} className="mb-5 inline-flex text-sm font-semibold text-plum-700 hover:underline">← Back to conversation</Link><PageHeader title="Create a quote" subtitle="Make the scope and pricing easy for your client to understand."/><Card variant="soft" className="mb-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="fleora-kicker">Event brief</p><p className="mt-1 font-display text-2xl text-ink-900">{event?.name}</p><p className="mt-2 text-sm text-ink-600">{shortDate(event?.event_date)} · {event?.location??"TBD"} · {event?.guest_count??"?"} guests</p></div><div className="flex gap-2"><Badge tone="champagne">{money(event?.budget)} budget</Badge>{event?.style&&<Badge tone="plum">{event.style}</Badge>}</div></div></Card><QuoteForm conversationId={params.conversationId} categories={categories}/></div>;
}
