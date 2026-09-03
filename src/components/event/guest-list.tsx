"use client";

import { useTransition } from "react";
import type { Guest } from "@/lib/types";
import { Input, Button } from "@/components/ui";
import { addGuest, setGuestRsvp, removeGuest } from "@/lib/actions/event";

const rsvpTone: Record<string, string> = { yes: "text-emerald-600", no: "text-rose-500", pending: "text-ink-400" };

export function GuestList({ eventId, guests }: { eventId: string; guests: Guest[] }) {
  const [pending, start] = useTransition();
  const attending = guests.filter((g) => g.rsvp === "yes").reduce((s, g) => s + g.party_size, 0);
  const invited = guests.reduce((s, g) => s + g.party_size, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-500"><span className="font-bold text-ink-900">{attending}</span> attending · {invited} invited{pending && <span className="ml-2 text-xs text-ink-400">saving…</span>}</p>
      <ul className="divide-y divide-plum-50">
        {guests.map((g) => (
          <li key={g.id} className="flex items-center gap-1.5 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium text-ink-700">{g.name}{g.party_size > 1 && <span className="text-ink-400"> +{g.party_size - 1}</span>}</span>
            {(["yes", "pending", "no"] as const).map((r) => (
              <button key={r} onClick={() => start(() => setGuestRsvp(eventId, g.id, r))} className={`rounded-lg px-1.5 py-1 text-[10px] font-bold ${g.rsvp === r ? "bg-plum-100 " + rsvpTone[r] : "text-ink-300 hover:text-ink-500"}`}>{r === "yes" ? "Yes" : r === "no" ? "No" : "?"}</button>
            ))}
            <button onClick={() => start(() => removeGuest(eventId, g.id))} className="ml-1 text-ink-300 hover:text-rose-500" aria-label="Remove guest">✕</button>
          </li>
        ))}
        {guests.length === 0 && <li className="py-2 text-sm text-ink-400">No guests added yet.</li>}
      </ul>
      <form action={(fd) => start(() => addGuest(eventId, fd))} className="flex flex-wrap items-end gap-2">
        <Input name="name" placeholder="Guest name" required className="min-w-36 flex-1" />
        <Input name="party_size" type="number" min={1} defaultValue={1} className="w-16 px-2" />
        <Button type="submit" variant="secondary" size="sm">Add</Button>
      </form>
    </div>
  );
}
