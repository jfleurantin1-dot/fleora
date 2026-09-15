"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  CardIcon,
  CheckIcon,
  HomeIcon,
  ImageFrameIcon,
  MessageIcon,
  SparkleIcon,
  StoreIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

const items = [
  ["", "Event Home", HomeIcon],
  ["/summary", "Party Plan Summary", CardIcon],
  ["/plan", "My Party Plan", SparkleIcon],
  ["/diy", "DIY Shopping", ImageFrameIcon],
  ["/vendors", "Vendors", StoreIcon],
  ["/guests", "Guests & Invitations", UsersIcon],
  ["/checklist", "Checklist", CheckIcon],
  ["/budget", "Budget", WalletIcon],
  ["/timeline", "Timeline", CalendarIcon],
  ["/payments", "Payments", WalletIcon],
] as const;

function selectedPath(pathname: string, eventId: string, suffix: string) {
  const base = `/events/${eventId}`;
  if (!suffix) return pathname === base;
  if (suffix === "/plan") return pathname === `${base}/plan` || pathname.startsWith(`${base}/plan/`) || pathname === `${base}/services` || pathname === `${base}/entertainment` || pathname === `${base}/venue-logistics`;
  if (suffix === "/vendors") return pathname === `${base}/vendors` || pathname.startsWith(`${base}/matches/`);
  return pathname === `${base}${suffix}` || pathname.startsWith(`${base}${suffix}/`);
}

function Links({eventId}:{eventId:string}) {
  const pathname = usePathname();
  return <nav aria-label="Event workspace" className="space-y-1">
    {items.map(([suffix,label,Icon])=>{
      const selected=selectedPath(pathname,eventId,suffix);
      return <Link key={suffix||"home"} href={`/events/${eventId}${suffix}`} aria-current={selected?"page":undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-200 active:scale-[.98] ${selected?"bg-brand text-brand-ink":"text-ink-600 hover:bg-plum-50 hover:text-plum-800"}`}><Icon size={18}/><span>{label}</span></Link>;
    })}
    <Link href="/messages" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-600 transition-colors duration-200 hover:bg-plum-50 hover:text-plum-800 active:scale-[.98]"><MessageIcon size={18}/><span>Messages</span></Link>
  </nav>;
}

export function EventWorkspaceNav({eventId}:{eventId:string}) {
  return <>
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-xl border border-[#E8E1ED] bg-white p-3 shadow-fleora">
        <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[.14em] text-ink-400">Event menu</p>
        <Links eventId={eventId}/>
      </div>
    </aside>
    <details className="group mb-6 rounded-xl border border-[#E8E1ED] bg-white p-2 shadow-fleora lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-semibold text-ink-900 marker:content-none">
        <span>Event menu</span><span className="text-plum-600 transition-transform duration-200 group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-plum-100 px-1 pb-1 pt-2"><Links eventId={eventId}/></div>
    </details>
  </>;
}
