"use client";
import { useState } from "react";
import { declineInquiry } from "./actions";
export function DeclineInquiry({conversationId}:{conversationId:string}){
 const [open,setOpen]=useState(false);
 if(!open)return <button type="button" onClick={()=>setOpen(true)} className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">Decline inquiry</button>;
 return <form action={declineInquiry} className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
  <input type="hidden" name="conversation_id" value={conversationId}/><p className="text-sm font-semibold text-ink-900">Why are you declining?</p><p className="mt-1 text-xs text-ink-500">This reason is for Fleora and won&apos;t automatically be shown to the client.</p>
  <select name="reason" required defaultValue="" className="mt-3 w-full rounded-xl border border-[#DED5DC] bg-white px-3 py-2.5 text-sm"><option value="" disabled>Select a reason</option><option value="not_available">Not available on this date</option><option value="already_booked">Already booked</option><option value="outside_service_area">Outside my service area</option><option value="service_not_offered">Not a service I provide</option><option value="budget_not_fit">Budget isn&apos;t a fit</option><option value="other">Other</option></select>
  <textarea name="note" rows={3} placeholder="Optional internal note" className="mt-3 w-full rounded-xl border border-[#DED5DC] bg-white px-3 py-2.5 text-sm"/>
  <div className="mt-3 flex gap-2"><button type="button" onClick={()=>setOpen(false)} className="flex-1 rounded-xl border border-[#DED5DC] bg-white px-3 py-2 text-sm font-semibold">Cancel</button><button type="submit" className="flex-1 rounded-xl bg-rose-700 px-3 py-2 text-sm font-semibold text-white">Decline inquiry</button></div>
 </form>
}
