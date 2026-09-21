import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Button, Input } from "@/components/ui";
import { BrandLogo } from "@/components/brand-logo";
import { submitRsvp } from "./actions";
import { shortDate } from "@/lib/format";

export default async function RsvpPage(
  props:{params:Promise<{token:string}>;searchParams:Promise<{saved?:string;closed?:string;potluck_unavailable?:string}>}
){
  const searchParams=await props.searchParams;
  const params=await props.params;
  const s=await createClient();
  const[{data},{data:potluck},{data:extrasData}]=await Promise.all([
    s.rpc("get_public_rsvp",{p_token:params.token}),
    s.rpc("get_public_potluck_options",{p_token:params.token}),
    s.rpc("get_public_rsvp_extras",{p_token:params.token}),
  ]);
  const r=data?.[0];
  if(!r)notFound();
  const title=r.rsvp_title||r.event_name;
  const potluckOptions=potluck??[];
  const selectedDish=potluckOptions.find(dish=>dish.is_mine)?.potluck_item_id??"";
  const extras=extrasData?.[0];
  const calendarHref=buildCalendarHref(title,r.event_date,extras?.event_start_time,extras?.event_end_time,r.event_location);
  const mapHref=r.event_location?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.event_location)}`:null;

  return <main className="min-h-screen bg-white px-4 py-10"><div className="mx-auto max-w-lg">
    <div className="mb-8 flex justify-center"><BrandLogo/></div>
    <Card variant="feature" padding="lg">
      <p className="fleora-kicker text-center">You’re invited</p>
      <h1 className="mt-2 text-center font-display text-4xl text-ink-900">{title}</h1>
      <p className="mt-3 text-center text-sm text-ink-600">{shortDate(r.event_date)}{r.event_location?` · ${r.event_location}`:""}</p>
      {r.rsvp_deadline&&<p className="mt-2 text-center text-xs font-semibold text-plum-700">Please RSVP by {shortDate(r.rsvp_deadline)}</p>}
      {searchParams.saved&&<div className="mt-5 rounded-xl bg-sage-50 p-3 text-center text-sm font-semibold text-sage-700">Your RSVP has been saved. We can’t wait to celebrate with you!</div>}
      {searchParams.potluck_unavailable&&<div className="mt-3 rounded-xl bg-blush-50 p-3 text-center text-sm font-semibold text-[#9B5065]">That dish was just claimed by another guest. Your RSVP was saved—please choose another available dish below.</div>}
      {(r.rsvp_closed||searchParams.closed)&&<div className="mt-5 rounded-xl bg-blush-50 p-3 text-center text-sm font-semibold text-[#9B5065]">Online RSVPs are now closed. Please contact the host if you need to update your response.</div>}
      <div className="my-6 h-px bg-plum-100"/>
      <p className="text-sm text-ink-600">Hi <b>{r.invitation_name||r.guest_name}</b>, please let the host know if you can make it.</p>
      {r.rsvp==="yes"&&<div className="mt-5 rounded-2xl border border-sage-100 bg-sage-50/70 p-4">
        <p className="text-sm font-bold text-ink-900">You’re on the guest list!</p>
        {extras?.selected_potluck_item&&<p className="mt-1 text-xs text-ink-600">You’re bringing: <b>{extras.selected_potluck_item}</b></p>}
        <div className="mt-3 flex flex-wrap gap-2"><a href={calendarHref} download="fleora-event.ics" className="rounded-full bg-white px-3 py-2 text-xs font-bold text-plum-700 shadow-sm">Add to calendar</a>{mapHref&&<a href={mapHref} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-2 text-xs font-bold text-plum-700 shadow-sm">Open in Maps</a>}</div>
        <p className="mt-3 text-[11px] text-ink-500">Keep this private link—you can return anytime before the deadline to update your RSVP or potluck selection.</p>
      </div>}
      {!r.rsvp_closed&&<form action={submitRsvp.bind(null,params.token)} className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="cursor-pointer rounded-xl border border-sage-200 bg-sage-50 p-4 text-center font-semibold text-sage-700"><input type="radio" name="rsvp" value="yes" defaultChecked={r.rsvp==="yes"} required className="mr-2"/>Joyfully accept</label>
          <label className="cursor-pointer rounded-xl border border-blush-200 bg-blush-50 p-4 text-center font-semibold text-[#9B5065]"><input type="radio" name="rsvp" value="no" defaultChecked={r.rsvp==="no"} required className="mr-2"/>Can’t attend</label>
        </div>
        <label className="block text-sm font-semibold text-ink-700">Number attending<Input name="party_size" type="number" min={1} max={r.invited_party_size} defaultValue={r.rsvp==="yes"?Math.max(1,r.party_size):r.invited_party_size} className="mt-1"/></label>
        {r.plus_one_allowed&&<label className="block text-sm font-semibold text-ink-700">Plus-one name <span className="font-normal text-ink-400">(optional)</span><Input name="plus_one_name" defaultValue={r.plus_one_name??""} className="mt-1"/></label>}
        <label className="block text-sm font-semibold text-ink-700">Dietary notes<Input name="dietary" defaultValue={r.dietary??""} placeholder="Allergies or dietary restrictions" className="mt-1"/></label>
        {potluckOptions.length>0&&<label className="block rounded-2xl border border-plum-100 bg-plum-50/50 p-4 text-sm font-semibold text-ink-700">
          Potluck sign-up <span className="font-normal text-ink-400">(optional)</span>
          <span className="mt-1 block text-xs font-normal text-ink-500">Choose one available dish to bring. You can return to this page later to change it.</span>
          <select name="potluck_item_id" defaultValue={selectedDish} className="mt-3 w-full rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm text-ink-800">
            <option value="">I’ll decide later</option>
            {potluckOptions.map(dish=><option key={dish.potluck_item_id} value={dish.potluck_item_id} disabled={!dish.available}>{dish.item} · {dish.category.replaceAll("_"," ")}{dish.is_mine?" (your selection)":!dish.available?" (already claimed)":""}</option>)}
          </select>
          <span className="my-2 block text-center text-[11px] font-bold uppercase tracking-wide text-ink-400">or suggest your own</span>
          <Input name="potluck_custom_item" placeholder="What would you like to bring?" />
        </label>}
        <Button type="submit" size="lg" className="w-full">Send RSVP</Button>
      </form>}
    </Card>
    <p className="mt-5 text-center text-xs text-ink-400">Powered by Fleora · No account required</p>
  </div></main>;
}

function buildCalendarHref(title:string,date:string|null,start:string|null|undefined,end:string|null|undefined,location:string|null){
  const actualDate=date??new Date().toISOString().slice(0,10);
  const day=actualDate.replaceAll("-","");
  const formatTime=(value:string)=>value.replaceAll(":","").slice(0,6).padEnd(6,"0");
  let dates:string;
  if(start&&day)dates=`DTSTART:${day}T${formatTime(start)}\r\nDTEND:${day}T${formatTime(end||start)}`;
  else{
    const next=new Date(`${actualDate}T00:00:00Z`);next.setUTCDate(next.getUTCDate()+1);
    dates=`DTSTART;VALUE=DATE:${day}\r\nDTEND;VALUE=DATE:${next.toISOString().slice(0,10).replaceAll("-","")}`;
  }
  const safe=(value:string)=>value.replaceAll("\\","\\\\").replaceAll(",","\\,").replaceAll(";","\\;").replaceAll("\n","\\n");
  const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fleora//RSVP//EN\r\nBEGIN:VEVENT\r\n${dates}\r\nSUMMARY:${safe(title)}\r\nLOCATION:${safe(location??"")}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
