import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { Button, Card, Input } from "@/components/ui";
import { shortDate } from "@/lib/format";

export default async function RsvpPreviewPage(props:{params:Promise<{id:string}>}){
  const params=await props.params;await requireProfile();const s=await createClient();
  const[{data:event},{data:potluck},{data:plan}]=await Promise.all([
    s.from("events").select("*").eq("id",params.id).single(),
    s.from("event_potluck_items").select("id,item,category,assigned_to").eq("event_id",params.id).order("created_at"),
    s.from("event_plan_items").select("id").eq("event_id",params.id).eq("item_key","potluck").maybeSingle(),
  ]);
  if(!event)notFound();
  return <main className="min-h-screen bg-white px-4 py-8"><div className="mx-auto max-w-lg">
    <div className="mb-4 flex items-center justify-between gap-3"><Link href={`/events/${event.id}/guests`} className="text-sm font-bold text-plum-700">← Back to guest list</Link><span className="rounded-full bg-champagne-50 px-3 py-1 text-xs font-bold text-ink-600">Preview only</span></div>
    <div className="mb-8 flex justify-center"><BrandLogo/></div>
    <Card variant="feature" padding="lg">
      <p className="fleora-kicker text-center">You’re invited</p><h1 className="mt-2 text-center font-display text-4xl text-ink-900">{event.rsvp_title||event.name}</h1><p className="mt-3 text-center text-sm text-ink-600">{shortDate(event.event_date)}{event.location?` · ${event.location}`:""}</p>{event.rsvp_deadline&&<p className="mt-2 text-center text-xs font-semibold text-plum-700">Please RSVP by {shortDate(event.rsvp_deadline)}</p>}
      <div className="my-6 h-px bg-plum-100"/><p className="text-sm text-ink-600">Hi <b>Guest Name</b>, please let the host know if you can make it.</p>
      <div className="mt-5 space-y-4 opacity-90"><div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-sage-200 bg-sage-50 p-4 text-center font-semibold text-sage-700">Joyfully accept</div><div className="rounded-xl border border-blush-200 bg-blush-50 p-4 text-center font-semibold text-[#9B5065]">Can’t attend</div></div><label className="block text-sm font-semibold text-ink-700">Number attending<Input value="1" readOnly className="mt-1"/></label><label className="block text-sm font-semibold text-ink-700">Dietary notes<Input placeholder="Allergies or dietary restrictions" readOnly className="mt-1"/></label>
        {plan&&(potluck??[]).length>0&&<div className="rounded-2xl border border-plum-100 bg-plum-50/50 p-4 text-sm font-semibold text-ink-700">Potluck sign-up <span className="font-normal text-ink-400">(optional)</span><p className="mt-1 text-xs font-normal text-ink-500">Guests can choose an available dish or suggest their own.</p><select disabled className="mt-3 w-full rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm"><option>Choose an available dish</option>{(potluck??[]).map(item=><option key={item.id}>{item.item}{item.assigned_to?" (already claimed)":""}</option>)}</select></div>}
        <Button type="button" size="lg" className="w-full" disabled>Send RSVP</Button>
      </div>
    </Card><p className="mt-5 text-center text-xs text-ink-400">Powered by Fleora · Preview only</p>
  </div></main>;
}
