"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { moderateVendor } from "./actions";

type ActionKind="suspended"|"deleted";

export function AdminVendorModerationActions({vendorId,businessName,showSuspend=true}:{vendorId:string;businessName:string;showSuspend?:boolean}){
  const [kind,setKind]=useState<ActionKind|null>(null);
  const [reason,setReason]=useState("");
  const [error,setError]=useState("");
  const [pending,startTransition]=useTransition();
  const close=()=>{if(pending)return;setKind(null);setReason("");setError("");};
  const submit=()=>{
    if(!kind)return;
    if(reason.trim().length<5){setError("Please enter a reason (at least 5 characters).");return;}
    startTransition(async()=>{
      const result=await moderateVendor(vendorId,kind,reason);
      if(result?.error){setError(result.error);return;}
      close();
    });
  };
  return <>
    {showSuspend&&<Button type="button" size="sm" variant="secondary" onClick={()=>setKind("suspended")}>Suspend</Button>}
    <Button type="button" size="sm" variant="secondary" onClick={()=>setKind("deleted")}>Delete</Button>
    {kind&&<div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="moderation-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="fleora-kicker">Admin confirmation</p>
        <h2 id="moderation-title" className="mt-1 font-display text-2xl text-ink-900">Are you sure you want to {kind==="deleted"?"delete":"suspend"} {businessName}?</h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">{kind==="deleted"?"This removes the vendor from the live Fleora marketplace. The vendor and your reason stay in the admin audit history so deleted accounts can still be reported.":"This temporarily removes the vendor from discovery until an admin approves the profile again."}</p>
        <label className="mt-5 block"><span className="text-sm font-semibold text-ink-800">Reason <span className="text-rose-600">*</span></span><textarea value={reason} onChange={(e)=>{setReason(e.target.value);setError("");}} rows={4} placeholder={kind==="deleted"?"Why is this vendor being deleted?":"Why is this vendor being suspended?"} className="mt-2 w-full rounded-xl border border-plum-200 bg-white px-3 py-3 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100"/></label>
        {error&&<p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close} disabled={pending}>Cancel</Button><Button type="button" onClick={submit} disabled={pending||reason.trim().length<5}>{pending?"Saving…":kind==="deleted"?"Yes, delete vendor":"Yes, suspend vendor"}</Button></div>
      </div>
    </div>}
  </>;
}
