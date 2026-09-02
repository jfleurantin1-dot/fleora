"use client";

import { useTransition } from "react";
import type { ChecklistItem } from "@/lib/types";
import { toggleChecklistItem } from "@/lib/actions/event";

export function Checklist({ eventId, items }: { eventId: string; items: ChecklistItem[] }) {
  const [pending, start] = useTransition();
  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {done}/{items.length} done
        </span>
        {pending && <span className="text-xs text-slate-400">saving…</span>}
      </div>
      {items
        .slice()
        .sort((a, b) => a.sort - b.sort)
        .map((i) => (
          <label
            key={i.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-plum-50"
          >
            <input
              type="checkbox"
              checked={i.done}
              onChange={(e) => start(() => toggleChecklistItem(eventId, i.id, e.target.checked))}
              className="h-4 w-4 rounded border-plum-300 text-plum-600 focus:ring-plum-400"
            />
            <span className={`flex-1 text-sm ${i.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
              {i.title}
            </span>
            {i.weeks_before != null && (
              <span className="text-xs text-slate-400">{i.weeks_before}w before</span>
            )}
          </label>
        ))}
    </div>
  );
}
