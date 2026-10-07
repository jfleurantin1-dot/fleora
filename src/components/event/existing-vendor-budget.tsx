"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui";
import { ExpenseForm } from "@/app/(app)/events/[id]/budget/expense-form";
import { getExistingVendorExpense } from "@/app/(app)/events/[id]/budget/actions";
import type { BudgetExpense } from "@/lib/types";

export function ExistingVendorBudget({
  eventId, itemKey, planKey, label, category,
}: {
  eventId: string; itemKey: string; planKey: string; label: string; category: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [details, setDetails] = useState<{
    expense?: BudgetExpense; readerEnabled: boolean;
  } | null>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  async function edit() {
    setOpen(true);
    setLoading(true);
    setError("");
    setDetails(null);
    try {
      const result = await getExistingVendorExpense(eventId, planKey);
      setDetails({ expense: result.expense ?? undefined, readerEnabled: result.readerEnabled });
    } catch {
      setError("Could not load vendor details. Close this window and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-choice-details-for={itemKey} data-choice-value="existing"
      className="mt-4 rounded-xl border border-plum-100 bg-plum-50/50 p-4">
      <p className="text-sm font-semibold text-ink-900">Keep your vendor in your budget.</p>
      <p className="mt-1 text-sm text-ink-600">
        Add their name, total price, amount paid, and invoice. You can update the same entry anytime.
      </p>
      <div className="mt-3">
        <Button type="button" variant="secondary" onClick={() => void edit()}>
          {saved ? "Edit vendor details & invoice" : "Add / edit vendor details & invoice"}
        </Button>
      </div>
      {saved && <p role="status" className="mt-2 text-sm text-plum-700">
        Saved to your budget sheet. Save this chapter to keep your planning choices.
      </p>}
      {open && createPortal(
        <dialog ref={dialog} aria-labelledby={titleId}
          onCancel={() => setOpen(false)}
          onClose={() => setOpen(false)}
          onSubmit={(event) => event.stopPropagation()}
          className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-plum-100 bg-white p-5 text-ink-900 shadow-xl backdrop:bg-black/40 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="font-display text-2xl">{label}: vendor details</h2>
              <p className="mt-2 text-sm text-ink-600">
                Save directly to your budget sheet. Your chapter choices stay here while you add the details.
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>Close</Button>
          </div>
          {loading && <p role="status">Loading vendor details…</p>}
          {error && <p role="alert">{error}</p>}
          {details && <ExpenseForm eventId={eventId} expense={details.expense}
            readerEnabled={details.readerEnabled} planKey={planKey}
            initialDescription={label} initialCategory={category}
            onSaved={() => { setSaved(true); dialog.current?.close(); }} />}
        </dialog>, document.body,
      )}
    </div>
  );
}
