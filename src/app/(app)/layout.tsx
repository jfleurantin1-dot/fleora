import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { initials } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const isVendor = profile.account_type === "vendor";
  const isAdmin = profile.account_type === "admin";

  const links = isVendor
    ? [
        { href: "/vendor/dashboard", label: "Dashboard" },
        { href: "/vendor/leads", label: "Leads" },
        { href: "/messages", label: "Messages" },
        { href: "/vendor/onboarding", label: "My profile" },
      ]
    : [
        { href: "/dashboard", label: "My events" },
        { href: "/messages", label: "Messages" },
        { href: "/vendors/browse", label: "Browse vendors" },
      ];

  if (isAdmin) links.push({ href: "/admin", label: "Admin" });

  return (
    <div className="min-h-screen">
      <header className="border-b border-plum-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href={isVendor ? "/vendor/dashboard" : "/dashboard"} className="font-semibold text-plum-700">
              🌸 Fleora
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-plum-50 hover:text-plum-700"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {profile.first_name} {profile.last_name}
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-plum-100 text-xs font-semibold text-plum-700">
              {initials(profile.first_name, profile.last_name)}
            </span>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-slate-400 hover:text-slate-700">Sign out</button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-plum-50"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
