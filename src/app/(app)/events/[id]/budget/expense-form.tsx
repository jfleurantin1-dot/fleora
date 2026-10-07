"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui";
import { BUDGET_CATEGORIES } from "@/lib/budget";
import type { BudgetExpense } from "@/lib/types";
import {
  deleteExpense,
  deleteInvoice,
  extractInvoice,
  saveExpense,
} from "./actions";

export function ExpenseForm({
  eventId,
  expense,
  bookings = [],
  readerEnabled = false,
  onSaved,
  planKey,
  initialDescription = "",
  initialCategory = "Other",
}: {
  eventId: string;
  expense?: BudgetExpense;
  bookings?: Array<{ id: string; label: string }>;
  readerEnabled?: boolean;
  onSaved?: () => void;
  planKey?: string;
  initialDescription?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState(expense?.description ?? initialDescription);
  const [vendor, setVendor] = useState(expense?.vendor_name ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [paid, setPaid] = useState(String(expense?.paid_amount ?? 0));
  const [hasFile, setHasFile] = useState(false);
  const [showDetails, setShowDetails] = useState(Boolean(expense || planKey));
  const [reading, setReading] = useState(false);
  async function submit(fd: FormData) {
    setBusy(true);
    setMessage("");
    try {
      const result = await saveExpense(eventId, fd);
      if (result.error) setMessage(result.error);
      else {
        setMessage("Saved to your budget.");
        router.refresh();
        if (!expense) {
          form.current?.reset();
          setDescription("");
          setVendor("");
          setAmount("");
          setPaid("0");
          setHasFile(false);
          setShowDetails(false);
          setTarget("");
        }
        onSaved?.();
      }
    } catch {
      setMessage("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function read(file?: File) {
    if (!form.current) return;
    const fd = new FormData(form.current);
    if (file) fd.set("invoice", file);
    setShowDetails(true);
    setBusy(true);
    setReading(true);
    setMessage("Reading invoice…");
    try {
      const result = await extractInvoice(eventId, fd);
      if (result.error) setMessage(result.error);
      else if (result.data) {
        setVendor(result.data.vendor_name);
        setDescription(result.data.description);
        if (
          result.data.currency &&
          result.data.currency.toUpperCase() !== "USD"
        ) {
          setAmount("");
          setMessage(
            `This invoice uses ${result.data.currency}. Enter its USD equivalent before saving.`,
          );
        } else {
          setAmount(
            result.data.amount === null ? "" : String(result.data.amount),
          );
          setMessage(
            "Review the extracted details and confirm the full total before saving. Amount paid must be entered separately.",
          );
        }
      }
    } catch {
      setMessage("Could not read this invoice. Enter the details manually.");
    } finally {
      setBusy(false);
      setReading(false);
    }
  }
  return (
    <form ref={form} action={submit} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        {expense && (
          <input type="hidden" name="expense_id" value={expense.id} />
        )}
        {planKey && <input type="hidden" name="source_plan_key" value={planKey} />}
        {!expense && !planKey && (
          <Field label="Add to">
            <Select
              name="booking_id"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">New outside expense</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Invoice for {b.label} (already budgeted)
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field
          label={target ? "Upload invoice for this booking" : "Upload invoice"}
          hint="PDF, JPG, PNG or WebP · up to 3 MB. Attachments are private."
        >
          <Input
            name="invoice"
            type="file"
            required={Boolean(target)}
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setHasFile(Boolean(file));
              setMessage("");
              if (!file) return;
              setShowDetails(true);
              if (readerEnabled && !target && !expense) void read(file);
              else if (!target && !readerEnabled)
                setMessage("Invoice selected. Enter its details below, then save it to your budget.");
            }}
          />
        </Field>
        {!target && (
          <div className="space-y-2">
            <p className="text-sm text-ink-600">
              {readerEnabled
                ? "Upload an invoice to fill in the details, then review and save."
                : "Upload an invoice, then enter its details below. Automatic reading is not available yet."}
            </p>
            {readerEnabled && (
              <p className="text-xs text-ink-500">
                {expense ? "Read invoice sends" : "Selecting an invoice sends"} the file to OpenAI to prepare details for your review.
              </p>
            )}
            {!showDetails && (
              <Button type="button" variant="secondary" onClick={() => setShowDetails(true)}>
                Enter manually
              </Button>
            )}
          </div>
        )}
        {!target && showDetails && (
          <>
            <p className="font-medium text-ink-900">{hasFile ? "Review invoice details" : "Expense details"}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Item">
                <Input
                  name="description"
                  required
                  maxLength={200}
                  placeholder="Cake, balloons, outfit…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <Field label="Vendor / store">
                <Input
                  name="vendor_name"
                  maxLength={200}
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category">
                <Select
                  name="category"
                  defaultValue={expense?.category ?? initialCategory}
                >
                  {BUDGET_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Total cost ($)">
                <Input
                  name="amount"
                  type="number"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Amount paid ($)">
                <Input
                  name="paid_amount"
                  type="number"
                  min="0"
                  max={amount || "99999999.99"}
                  step="0.01"
                  required
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                />
              </Field>
            </div>
          </>
        )}
        {target ? (
          <p className="text-sm text-ink-600">
            This invoice will attach to your existing booking without adding
            another expense.
          </p>
        ) : showDetails ? (
          <p className="text-sm text-ink-600">
            Enter the full cost once. Deposits go under amount paid.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          {readerEnabled && !target && hasFile && (
            <Button
              type="button"
              variant="secondary"
              disabled={!hasFile}
              onClick={() => void read()}
            >
              Read invoice
            </Button>
          )}
          {(target || showDetails) && <Button type="submit">
            {reading ? "Reading invoice…" : busy
              ? "Working…"
              : target
                ? "Attach invoice"
                : expense
                  ? "Save changes"
                  : "Save to budget"}
          </Button>}
        </div>
      </fieldset>
      <p role="status" aria-live="polite" className="text-sm text-plum-700">
        {message}
      </p>
    </form>
  );
}
export function ExpenseControls({
  eventId,
  expense,
  readerEnabled,
}: {
  eventId: string;
  expense: BudgetExpense;
  readerEnabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <div className="mt-3">
      <div className="flex gap-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEditing(!editing)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm("Delete this expense and its invoices?"))
              return;
            setBusy(true);
            try {
              const r = await deleteExpense(eventId, expense.id);
              if (r.error) setError(r.error);
              else router.refresh();
            } catch {
              setError("Could not delete expense.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Delete
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      {editing && (
        <div className="mt-4">
          <ExpenseForm
            eventId={eventId}
            expense={expense}
            readerEnabled={readerEnabled}
            onSaved={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}
export function RemoveInvoice({
  eventId,
  id,
}: {
  eventId: string;
  id: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm("Remove this invoice attachment?")) return;
          setBusy(true);
          try {
            const r = await deleteInvoice(eventId, id);
            if (r.error) setError(r.error);
            else router.refresh();
          } catch {
            setError("Could not remove invoice.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Remove
      </Button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
