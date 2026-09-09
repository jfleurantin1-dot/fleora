"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, MessageIcon, SearchIcon, UserIcon, WalletIcon } from "@/components/icons";

const clientLinks=[
  {href:"/dashboard",label:"Home",Icon:HomeIcon},
  {href:"/events",label:"Events",Icon:CalendarIcon},
  {href:"/vendors/browse",label:"Discover Vendors",Icon:SearchIcon},
  {href:"/messages",label:"Messages",Icon:MessageIcon},
  {href:"/planning",label:"Planning Tools",Icon:CalendarIcon},
];
const vendorLinks=[
  {href:"/vendor/dashboard",label:"Home",Icon:HomeIcon},
  {href:"/vendor/leads",label:"Inquiries",Icon:SearchIcon},
  {href:"/messages",label:"Messages",Icon:MessageIcon},
  {href:"/vendors/browse",label:"Discover Vendors",Icon:SearchIcon},
  {href:"/vendor/payments",label:"Payments",Icon:WalletIcon},
  {href:"/vendor/account",label:"Profile",Icon:UserIcon},
];
function active(p:string,h:string){
  if(h==="/dashboard"||h==="/vendor/dashboard")return p===h;
  if(h==="/events")return p==="/events"||p.startsWith("/events/");
  if(h==="/vendor/account")return p===h||p.startsWith("/vendor/onboarding")||p.startsWith("/vendor/availability");
  return p===h||p.startsWith(`${h}/`);
}
function linksFor(isVendor:boolean,isAdmin:boolean){
  const links=[...(isVendor?vendorLinks:clientLinks)];
  if(isAdmin)links.push({href:"/admin",label:"Admin",Icon:UserIcon});
  return links;
}
export function DesktopAppNav({isVendor,isAdmin}:{isVendor:boolean;isAdmin:boolean}){
  const p=usePathname();
  const links=linksFor(isVendor,isAdmin);
  return <nav className="hidden items-center gap-1 sm:flex">{links.map(({href,label})=><Link key={href} href={href} className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${active(p,href)?"bg-plum-50 text-plum-800":"text-ink-600 hover:text-plum-800"}`}>{label}</Link>)}</nav>;
}
export function MobileAppNav({isVendor,isAdmin}:{isVendor:boolean;isAdmin:boolean}){
  const p=usePathname();
  const links=linksFor(isVendor,isAdmin);
  return <nav aria-label={isVendor?"Vendor navigation":"Main navigation"} className="fixed inset-x-0 bottom-0 z-[70] flex gap-1 overflow-x-auto border-t border-[#E8E1ED] bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(50,20,95,0.08)] sm:hidden">
    {links.map(({href,label,Icon})=><Link key={href} href={href} className={`flex min-w-[72px] flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-center text-[9px] font-medium ${active(p,href)?"text-plum-700":"text-ink-500"}`}><Icon size={18}/><span className="whitespace-nowrap">{label}</span></Link>)}
  </nav>;
}
