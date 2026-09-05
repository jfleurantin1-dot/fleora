"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";
import { UserIcon } from "@/components/icons";
export function ProfileMenu({name,initials,isVendor}:{name:string;initials:string;isVendor:boolean}){
 const [open,setOpen]=useState(false); const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const close=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);
 return <div className="relative" ref={ref}><button onClick={()=>setOpen(v=>!v)} aria-label="Open profile menu" className="flex items-center gap-2 rounded-full p-1 transition hover:bg-plum-50"><span className="hidden text-xs font-medium text-ink-600 md:inline">{name}</span><span className="grid h-9 w-9 place-items-center rounded-full border border-plum-100 bg-plum-50 text-[10px] font-semibold text-plum-800">{initials}</span></button>{open&&<div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-[#E9E1EE] bg-white p-2 shadow-lift"><div className="border-b border-[#EEE8F1] px-3 py-2"><p className="text-xs text-ink-400">Signed in as</p><p className="truncate text-sm font-semibold text-ink-900">{name}</p></div><Link onClick={()=>setOpen(false)} href={isVendor?"/vendor/onboarding":"/profile"} className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-plum-50 hover:text-plum-800"><UserIcon size={16}/>Profile & Settings</Link><form action="/auth/signout" method="post"><button className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink-500 hover:bg-plum-50 hover:text-plum-800">Sign out</button></form></div>}</div>
}
