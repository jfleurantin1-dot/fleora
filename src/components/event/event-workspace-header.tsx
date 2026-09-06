import Link from "next/link";
import { CalendarIcon, MapPinIcon } from "@/components/icons";
import { shortDate } from "@/lib/format";
import { EventWorkspaceNav } from "./event-workspace-nav";

export function EventWorkspaceHeader({ event, active, eyebrow }: { event: any; active: string; eyebrow?: string }) {
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="fleora-kicker">{eyebrow ?? "Event workspace"}</p>
        <Link href={`/events/${event.id}`} className="mt-1 block font-display text-3xl text-ink-900 hover:text-plum-700">{event.name}</Link>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1.5"><CalendarIcon size={15}/>{shortDate(event.event_date)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPinIcon size={15}/>{event.location ?? "Location TBD"}</span>
        </div>
      </div>
      <Link href={`/events/${event.id}/edit`} className="rounded-full border border-plum-100 bg-white px-4 py-2 text-sm font-semibold text-plum-700 shadow-sm hover:bg-plum-50">Edit event details</Link>
    </div>
    <EventWorkspaceNav eventId={event.id} active={active}/>
  </div>;
}
