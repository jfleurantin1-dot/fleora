"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, MessageIcon, SearchIcon, UserIcon } from "@/components/icons";

const clientLinks = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/vendors/browse", label: "Discover", Icon: SearchIcon },
  { href: "/events", label: "My Events", Icon: CalendarIcon },
  { href: "/messages", label: "Messages", Icon: MessageIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

const vendorLinks = [
  { href: "/vendor/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/vendor/leads", label: "Leads", Icon: SearchIcon },
  { href: "/vendor/claim", label: "Claim", Icon: SearchIcon },
  { href: "/messages", label: "Messages", Icon: MessageIcon },
  { href: "/vendor/onboarding", label: "Profile", Icon: UserIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/vendor/dashboard") return pathname === href;
  if (href === "/events") return pathname === "/events" || pathname.startsWith("/events/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ isVendor, isAdmin }: { isVendor: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [...(isVendor ? vendorLinks : clientLinks)];
  if (isAdmin) links.push({ href: "/admin", label: "Admin", Icon: UserIcon });

  return (
    <>
      <nav className="hidden items-center gap-1 sm:flex">
        {links.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active ? "bg-white text-plum-700 shadow-sm" : "text-ink-600 hover:bg-white/70 hover:text-plum-700"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#E9E3E7] bg-white/95 px-2 pb-[max(9px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl sm:hidden">
        {links.slice(0, 5).map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
                active ? "text-plum-700" : "text-ink-400 hover:text-plum-600"
              }`}
            >
              <span className={`grid h-7 w-9 place-items-center rounded-full transition ${active ? "bg-plum-50" : ""}`}>
                <Icon size={18} />
              </span>
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
