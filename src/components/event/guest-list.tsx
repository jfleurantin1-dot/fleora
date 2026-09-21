"use client";

import { useEffect, useState, useTransition } from "react";
import type { Guest } from "@/lib/types";
import { Input, Button, Badge } from "@/components/ui";
import { addGuest, importGuestsFromContacts, setGuestRsvp, removeGuest, updateRsvpSettings } from "@/lib/actions/event";

type ContactPickerContact = { name?: string[]; email?: string[]; tel?: string[] };
type ContactsManager = {
  getProperties: () => Promise<string[]>;
  select: (properties: string[], options: { multiple: boolean }) => Promise<ContactPickerContact[]>;
};
type ContactNavigator = Navigator & { contacts?: ContactsManager };

export function GuestList({eventId,guests,rsvpTitle,rsvpDeadline,eventName}:{eventId:string;guests:Guest[];rsvpTitle:string|null;rsvpDeadline:string|null;eventName:string}){
  const[pending,start]=useTransition();
  const[copied,setCopied]=useState<string|null>(null);
  const[contactsSupported,setContactsSupported]=useState<boolean|null>(null);
  const[contactNotice,setContactNotice]=useState<string|null>(null);
  const invited=guests.reduce((s,g)=>s+Number(g.invited_party_size||g.party_size||1),0);
  const attending=guests.filter(g=>g.rsvp==="yes").reduce((s,g)=>s+Number(g.party_size||0),0);
  const declined=guests.filter(g=>g.rsvp==="no").reduce((s,g)=>s+Number(g.invited_party_size||1),0);
  const awaiting=guests.filter(g=>g.rsvp==="pending").reduce((s,g)=>s+Number(g.invited_party_size||g.party_size||1),0);

  useEffect(()=>setContactsSupported(Boolean((navigator as ContactNavigator).contacts)),[]);

  function rsvpUrl(g:Guest){return `${window.location.origin}/rsvp/${g.rsvp_token}`}
  function copyLink(g:Guest){navigator.clipboard.writeText(rsvpUrl(g));setCopied(g.id);setTimeout(()=>setCopied(null),1600)}

  async function shareLink(g:Guest){
    const url=rsvpUrl(g);const title=`${eventName} RSVP`;const text=`You’re invited to ${eventName}! Please RSVP here:`;
    try{
      if(navigator.share){await navigator.share({title,text,url});return}
      if(g.phone){window.location.assign(`sms:${encodeURIComponent(g.phone)}?&body=${encodeURIComponent(`${text} ${url}`)}`);return}
      if(g.email){window.location.assign(`mailto:${encodeURIComponent(g.email)}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`);return}
      await navigator.clipboard.writeText(url);setContactNotice(`RSVP link copied for ${g.name}.`);
    }catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;setContactNotice("The invitation could not be opened. You can still copy the RSVP link.")}
  }

  async function inviteFromContacts(){
    const contacts=(navigator as ContactNavigator).contacts;
    if(!contacts){setContactNotice("Direct contact selection isn’t available in this browser. Add the guest below, then tap Share RSVP to use Messages, email or another phone app.");return}
    try{
      const available=await contacts.getProperties();
      const properties=["name","email","tel"].filter(property=>available.includes(property));
      const selected=await contacts.select(properties,{multiple:true});
      const imports=selected.map(contact=>({name:contact.name?.[0]||contact.email?.[0]||contact.tel?.[0]||"Guest",email:contact.email?.[0]||null,phone:contact.tel?.[0]||null})).filter(contact=>contact.email||contact.phone);
      if(!imports.length){setContactNotice("No contacts with a phone number or email were selected.");return}
      start(async()=>{
        const result=await importGuestsFromContacts(eventId,imports);
        const skipped=result.skipped?` ${result.skipped} duplicate${result.skipped===1?" was":"s were"} skipped.`:"";
        setContactNotice(`${result.added} contact${result.added===1?"":"s"} added.${skipped} Use Share RSVP beside each guest to send the invitation.`);
      });
    }catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;setContactNotice("Fleora couldn’t open your contacts. You can add guests manually below and share their RSVP links.")}
  }

  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat n={invited} label="Invited" cls="bg-plum-50 text-plum-700"/><Stat n={attending} label="Attending" cls="bg-sage-50 text-sage-700"/><Stat n={declined} label="Declined" cls="bg-blush-50 text-[#9B5065]"/><Stat n={awaiting} label="Pending" cls="bg-slate-50 text-ink-600"/></div>
    <div className="rounded-2xl border border-plum-100 bg-brand-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink-900">Invite from your phone</p><p className="mt-1 text-xs text-ink-600">Choose only the contacts you want to add. Fleora never receives the rest of your address book.</p></div><Button type="button" onClick={inviteFromContacts} disabled={pending||contactsSupported===null} size="sm">Invite from contacts</Button></div>
      {contactsSupported===false&&<p className="mt-2 text-[11px] text-ink-500">Contact selection is not available in this browser. Add a guest below, then use Share RSVP to open your phone’s sharing options.</p>}
      {contactNotice&&<p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-ink-600">{contactNotice}</p>}
    </div>
    <form action={fd=>start(()=>updateRsvpSettings(eventId,fd))} className="rounded-2xl border border-plum-100 bg-plum-50/45 p-3">
      <div className="mb-2"><p className="text-xs font-bold text-ink-800">RSVP page settings</p><p className="mt-0.5 text-[11px] text-ink-500">Give guests a polished title and a response deadline.</p></div>
      <div className="grid gap-2 sm:grid-cols-2"><Input name="rsvp_title" defaultValue={rsvpTitle??""} placeholder={eventName}/><Input name="rsvp_deadline" type="date" defaultValue={rsvpDeadline??""}/></div>
      <Button type="submit" variant="secondary" size="sm" className="mt-2">Save RSVP settings</Button>
    </form>
    {pending&&<p className="text-xs text-ink-400">Saving…</p>}
    <ul className="divide-y divide-plum-50">{guests.map(g=><li key={g.id} className="py-3">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-800">{g.invitation_name||g.name}<span className="font-normal text-ink-400"> · invited {g.invited_party_size||g.party_size}</span></p>{g.invitation_name&&g.invitation_name!==g.name&&<p className="truncate text-xs text-ink-500">Primary contact: {g.name}</p>}<p className="truncate text-xs text-ink-400">{g.email||g.phone||"No contact added"}{g.plus_one_allowed?" · Plus-one allowed":""}</p></div><Badge tone={g.rsvp==="yes"?"green":g.rsvp==="no"?"rose":"slate"}>{g.rsvp==="yes"?`${g.party_size} attending`:g.rsvp==="no"?"Declined":"Pending"}</Badge></div>
      <div className="mt-2 flex flex-wrap gap-1.5">{(["yes","pending","no"] as const).map(r=><button key={r} onClick={()=>start(()=>setGuestRsvp(eventId,g.id,r))} className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${g.rsvp===r?"border-plum-200 bg-plum-50 text-plum-700":"border-slate-100 text-ink-400"}`}>{r==="yes"?"Going":r==="no"?"Decline":"Reset"}</button>)}<button onClick={()=>shareLink(g)} className="rounded-lg border border-plum-100 bg-plum-50 px-2 py-1 text-[11px] font-semibold text-plum-700">Share RSVP</button><button onClick={()=>copyLink(g)} className="rounded-lg border border-plum-100 px-2 py-1 text-[11px] font-semibold text-plum-700">{copied===g.id?"Copied!":"Copy link"}</button><button onClick={()=>start(()=>removeGuest(eventId,g.id))} className="ml-auto text-[11px] text-rose-500">Remove</button></div>
    </li>)}{!guests.length&&<li className="py-3 text-sm text-ink-400">No guests added yet.</li>}</ul>
    <form action={fd=>start(()=>addGuest(eventId,fd))} className="rounded-2xl bg-plum-50/50 p-3"><p className="mb-1 text-xs font-bold text-ink-700">Add guest or household</p><p className="mb-3 text-[11px] text-ink-500">Use an invitation name like “The Smith Family” while keeping one primary contact.</p><div className="grid gap-2 sm:grid-cols-2"><Input name="name" placeholder="Primary contact name" required/><Input name="invitation_name" placeholder="Invitation name (optional)"/><Input name="email" type="email" placeholder="Email for RSVP"/><Input name="phone" placeholder="Phone (optional)"/><Input name="party_size" type="number" min={1} defaultValue={1}/><label className="flex items-center gap-2 rounded-xl border border-plum-100 bg-white px-3 text-xs font-semibold text-ink-600"><input name="plus_one_allowed" type="checkbox"/> Allow plus-one</label></div><Button type="submit" variant="secondary" size="sm" className="mt-2">Add to guest list</Button></form>
    <p className="text-[11px] leading-relaxed text-ink-400">Each guest or household gets a private RSVP link. Contact access is requested only when you tap Invite from contacts and select specific people.</p>
  </div>
}

function Stat({n,label,cls}:{n:number;label:string;cls:string}){return <div className={`rounded-xl p-2 text-center ${cls}`}><b className="block text-lg">{n}</b><span className="text-[10px] text-ink-500">{label}</span></div>}
