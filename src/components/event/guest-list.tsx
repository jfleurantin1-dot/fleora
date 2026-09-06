"use client";
import { useState, useTransition } from "react";
import type { Guest } from "@/lib/types";
import { Input, Button, Badge } from "@/components/ui";
import { addGuest, setGuestRsvp, removeGuest, updateRsvpSettings } from "@/lib/actions/event";

export function GuestList({eventId,guests,rsvpTitle,rsvpDeadline,eventName}:{eventId:string;guests:Guest[];rsvpTitle:string|null;rsvpDeadline:string|null;eventName:string}){
  const[pending,start]=useTransition(); const[copied,setCopied]=useState<string|null>(null);
  const invited=guests.reduce((s,g)=>s+Number(g.invited_party_size||g.party_size||1),0);
  const attending=guests.filter(g=>g.rsvp==="yes").reduce((s,g)=>s+Number(g.party_size||0),0);
  const declined=guests.filter(g=>g.rsvp==="no").reduce((s,g)=>s+Number(g.invited_party_size||1),0);
  const awaiting=guests.filter(g=>g.rsvp==="pending").reduce((s,g)=>s+Number(g.invited_party_size||g.party_size||1),0);
  function copyLink(g:Guest){navigator.clipboard.writeText(`${window.location.origin}/rsvp/${g.rsvp_token}`);setCopied(g.id);setTimeout(()=>setCopied(null),1600)}
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat n={invited} label="Invited" cls="bg-plum-50 text-plum-700"/><Stat n={attending} label="Attending" cls="bg-sage-50 text-sage-700"/><Stat n={declined} label="Declined" cls="bg-blush-50 text-[#9B5065]"/><Stat n={awaiting} label="Pending" cls="bg-slate-50 text-ink-600"/></div>
    <form action={fd=>start(()=>updateRsvpSettings(eventId,fd))} className="rounded-2xl border border-plum-100 bg-plum-50/45 p-3">
      <div className="mb-2"><p className="text-xs font-bold text-ink-800">RSVP page settings</p><p className="mt-0.5 text-[11px] text-ink-500">Give guests a polished title and a response deadline.</p></div>
      <div className="grid gap-2 sm:grid-cols-2"><Input name="rsvp_title" defaultValue={rsvpTitle??""} placeholder={eventName}/><Input name="rsvp_deadline" type="date" defaultValue={rsvpDeadline??""}/></div>
      <Button type="submit" variant="secondary" size="sm" className="mt-2">Save RSVP settings</Button>
    </form>
    {pending&&<p className="text-xs text-ink-400">Saving…</p>}
    <ul className="divide-y divide-plum-50">{guests.map(g=><li key={g.id} className="py-3">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-800">{g.invitation_name||g.name}<span className="font-normal text-ink-400"> · invited {g.invited_party_size||g.party_size}</span></p>{g.invitation_name&&g.invitation_name!==g.name&&<p className="truncate text-xs text-ink-500">Primary contact: {g.name}</p>}<p className="truncate text-xs text-ink-400">{g.email||g.phone||"No contact added"}{g.plus_one_allowed?" · Plus-one allowed":""}</p></div><Badge tone={g.rsvp==="yes"?"green":g.rsvp==="no"?"rose":"slate"}>{g.rsvp==="yes"?`${g.party_size} attending`:g.rsvp==="no"?"Declined":"Pending"}</Badge></div>
      <div className="mt-2 flex flex-wrap gap-1.5">{(["yes","pending","no"] as const).map(r=><button key={r} onClick={()=>start(()=>setGuestRsvp(eventId,g.id,r))} className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${g.rsvp===r?"border-plum-200 bg-plum-50 text-plum-700":"border-slate-100 text-ink-400"}`}>{r==="yes"?"Going":r==="no"?"Decline":"Reset"}</button>)}<button onClick={()=>copyLink(g)} className="rounded-lg border border-plum-100 px-2 py-1 text-[11px] font-semibold text-plum-700">{copied===g.id?"Copied!":"Copy RSVP link"}</button><button onClick={()=>start(()=>removeGuest(eventId,g.id))} className="ml-auto text-[11px] text-rose-500">Remove</button></div>
    </li>)}{!guests.length&&<li className="py-3 text-sm text-ink-400">No guests added yet.</li>}</ul>
    <form action={fd=>start(()=>addGuest(eventId,fd))} className="rounded-2xl bg-plum-50/50 p-3"><p className="mb-1 text-xs font-bold text-ink-700">Add guest or household</p><p className="mb-3 text-[11px] text-ink-500">Use an invitation name like “The Smith Family” while keeping one primary contact.</p><div className="grid gap-2 sm:grid-cols-2"><Input name="name" placeholder="Primary contact name" required/><Input name="invitation_name" placeholder="Invitation name (optional)"/><Input name="email" type="email" placeholder="Email for RSVP"/><Input name="phone" placeholder="Phone (optional)"/><Input name="party_size" type="number" min={1} defaultValue={1}/><label className="flex items-center gap-2 rounded-xl border border-plum-100 bg-white px-3 text-xs font-semibold text-ink-600"><input name="plus_one_allowed" type="checkbox"/> Allow plus-one</label></div><Button type="submit" variant="secondary" size="sm" className="mt-2">Add to guest list</Button></form>
    <p className="text-[11px] leading-relaxed text-ink-400">Each guest or household gets a private RSVP link. Reminder delivery is not active yet; this upgrade stores the deadline and response data needed for that next phase.</p>
  </div>
}
function Stat({n,label,cls}:{n:number;label:string;cls:string}){return <div className={`rounded-xl p-2 text-center ${cls}`}><b className="block text-lg">{n}</b><span className="text-[10px] text-ink-500">{label}</span></div>}
