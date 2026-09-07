import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { BellIcon, CalendarIcon, UserIcon } from "@/components/icons";

export default async function VendorAccountPage(){
  const profile=await requireProfile();
  return <div className="mx-auto max-w-2xl">
    <PageHeader title="Profile & settings" subtitle="Manage your Fleora vendor profile and account."/>
    <div className="space-y-4">
      <Card padding="lg">
        <p className="fleora-kicker">Business profile</p>
        <h2 className="mt-1 font-display text-2xl text-ink-900">Keep your storefront up to date</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">Update your business details, services, pricing and portfolio.</p>
        <ButtonLink href="/vendor/onboarding" className="mt-5">Edit my profile</ButtonLink>
      </Card>
      <Card padding="none">
        <Link href="/notifications" className="flex items-center gap-3 border-b border-plum-100 px-5 py-4 text-sm font-semibold text-ink-700 hover:bg-plum-50"><BellIcon size={18}/><span>Notifications</span></Link>
        <Link href="/vendor/availability" className="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-ink-700 hover:bg-plum-50"><CalendarIcon size={18}/><span>Manage availability</span></Link>
      </Card>
      <Card padding="lg">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-plum-50 text-plum-700"><UserIcon size={18}/></span><div><p className="text-sm font-semibold text-ink-900">{profile.first_name??"Vendor"} {profile.last_name??""}</p><p className="text-xs text-ink-500">Signed in to Fleora</p></div></div>
        <form action="/auth/signout" method="post" className="mt-5"><button type="submit" className="w-full rounded-xl border border-[#E9E1EE] bg-white px-4 py-3 text-sm font-semibold text-ink-600 transition hover:bg-plum-50 hover:text-plum-800">Sign out</button></form>
      </Card>
    </div>
  </div>;
}
