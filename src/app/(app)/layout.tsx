import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { initials } from "@/lib/format";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const isVendor = profile.account_type === "vendor";
  const isAdmin = profile.account_type === "admin";

  return (
    <div className="min-h-screen bg-ivory-50 pb-24 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#E9E3E7] bg-ivory-50/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href={isVendor ? "/vendor/dashboard" : "/dashboard"} className="group inline-flex items-start font-display text-[28px] leading-none text-plum-600">
              Fleora<span className="ml-1 mt-0.5 text-xs text-champagne-500 transition group-hover:rotate-12">✦</span>
            </Link>
            <AppNav isVendor={isVendor} isAdmin={isAdmin} />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ink-600 md:inline">{profile.first_name} {profile.last_name}</span>
            <Link
              href={isVendor ? "/vendor/onboarding" : "/profile"}
              className="grid h-9 w-9 place-items-center rounded-full border border-plum-100 bg-white text-xs font-bold text-plum-700 shadow-sm transition hover:border-plum-200"
              aria-label="Open profile"
            >
              {initials(profile.first_name, profile.last_name)}
            </Link>
            <form action="/auth/signout" method="post" className="hidden lg:block">
              <button className="text-xs font-semibold text-ink-400 transition hover:text-ink-900">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
