import Link from "next/link";

const items = [
  ["", "Event Home"],
  ["/plan", "My Party Plan"],
  ["/guests", "Guests & Invitations"],
  ["/services", "Vendors"],
  ["/checklist", "Checklist"],
  ["/budget", "Budget"],
  ["/timeline", "Timeline"],
] as const;

export function EventWorkspaceNav({ eventId, active }: { eventId: string; active: string }) {
  return (
    <nav aria-label="Event workspace" className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-2">
      {items.map(([suffix, label]) => {
        const key = suffix || "home";
        const selected = active === key;
        return <Link key={key} href={`/events/${eventId}${suffix}`} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${selected ? "bg-plum-500 text-white shadow-sm" : "bg-white text-ink-600 shadow-sm hover:bg-plum-50 hover:text-plum-700"}`}>{label}</Link>;
      })}
      <Link href="/messages" className="shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink-600 shadow-sm transition hover:bg-plum-50 hover:text-plum-700">Messages</Link>
      <Link href={`/events/${eventId}/payments`} className="shrink-0 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink-600 shadow-sm transition hover:bg-plum-50 hover:text-plum-700">Payments</Link>
    </nav>
  );
}
