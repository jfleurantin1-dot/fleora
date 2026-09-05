import { requireProfile } from "@/lib/auth";
import { initials } from "@/lib/format";
import { AppNav } from "@/components/app-nav";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileMenu } from "@/components/profile-menu";
import { NotificationBell } from "@/components/notification-bell";
export default async function AppLayout({children}:{children:React.ReactNode}){const profile=await requireProfile();const isVendor=profile.account_type==="vendor";const isAdmin=profile.account_type==="admin";const name=`${profile.first_name??""} ${profile.last_name??""}`.trim()||"Fleora member";return <div className="min-h-screen bg-[#FCFBFD] pb-24 sm:pb-0"><header className="sticky top-0 z-40 border-b border-[#EDE7F1] bg-white/92 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8"><div className="flex items-center gap-8"><BrandLogo href={isVendor?"/vendor/dashboard":"/dashboard"} compact/><AppNav isVendor={isVendor} isAdmin={isAdmin}/></div><div className="flex items-center gap-2"><NotificationBell userId={profile.id}/><ProfileMenu name={name} initials={initials(profile.first_name,profile.last_name)} isVendor={isVendor}/></div></div></header><main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">{children}</main></div>}
