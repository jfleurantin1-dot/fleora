"use client";

import { useTransition } from "react";
import type { ChecklistItem } from "@/lib/types";
import { toggleChecklistItem } from "@/lib/actions/event";

export function Checklist({ eventId, items }: { eventId: string; items: ChecklistItem[] }) {
  const [pending, start] = useTransition();
  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-500">{done}/{items.length} complete</span>
        {pending && <span className="text-xs text-ink-400">saving…</span>}
      </div>
      {items.slice().sort((a, b) => a.sort - b.sort).map((i) => (
        <label key={i.id} className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-plum-50/70">
          <input type="checkbox" checked={i.done} onChange={(e) => start(() => toggleChecklistItem(eventId, i.id, e.target.checked))} className="h-4 w-4 rounded border-plum-300 text-plum-600 focus:ring-plum-400" />
          <span className={`flex-1 text-sm ${i.done ? "text-ink-400 line-through" : "font-medium text-ink-700"}`}>{i.title}</span>
          {i.weeks_before != null && <span className="text-[10px] font-semibold text-ink-400">{i.weeks_before}w</span>}
        </label>
      ))}
      {items.length === 0 && <p className="py-2 text-sm text-ink-400">No tasks yet.</p>}
    </div>
  );
}
