"use client";

import { useTransition } from "react";
import type { Guest } from "@/lib/types";
import { Input, Button } from "@/components/ui";
import { addGuest, setGuestRsvp, removeGuest } from "@/lib/actions/event";

const rsvpTone: Record<string, string> = {
  yes: "text-emerald-600",
  no: "text-rose-500",
  pending: "text-slate-400",
};

export function GuestList({ eventId, guests }: { eventId: string; guests: Guest[] }) {
  const [pending, start] = useTransition();

  const attending = guests
    .filter((g) => g.rsvp === "yes")
    .reduce((s, g) => s + g.party_size, 0);
  const invited = guests.reduce((s, g) => s + g.party_size, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{attending}</span> attending ·{" "}
        {invited} invited{pending && <span className="ml-2 text-xs text-slate-400">saving…</span>}
      </p>

      <ul className="divide-y divide-plum-50">
        {guests.map((g) => (
          <li key={g.id} className="flex items-center gap-2 py-2 text-sm">
            <span className="flex-1 text-slate-700">
              {g.name}
              {g.party_size > 1 && <span className="text-slate-400"> +{g.party_size - 1}</span>}
            </span>
            {(["yes", "pending", "no"] as const).map((r) => (
              <button
                key={r}
                onClick={() => start(() => setGuestRsvp(eventId, g.id, r))}
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  g.rsvp === r ? "bg-plum-100 " + rsvpTone[r] : "text-slate-300 hover:text-slate-500"
                }`}
              >
                {r === "yes" ? "Yes" : r === "no" ? "No" : "?"}
              </button>
            ))}
            <button
              onClick={() => start(() => removeGuest(eventId, g.id))}
              className="ml-1 text-slate-300 hover:text-rose-500"
              aria-label="Remove guest"
            >
              ✕
            </button>
          </li>
        ))}
        {guests.length === 0 && <li className="py-2 text-sm text-slate-400">No guests added yet.</li>}
      </ul>

      <form
        action={(fd) => start(() => addGuest(eventId, fd))}
        className="flex flex-wrap items-end gap-2"
      >
        <Input name="name" placeholder="Guest name" required className="flex-1" />
        <Input name="party_size" type="number" min={1} defaultValue={1} className="w-16" />
        <Button type="submit" variant="secondary" size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}
