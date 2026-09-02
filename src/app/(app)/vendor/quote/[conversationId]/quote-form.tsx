"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { sendQuote, type SendQuoteState } from "./actions";
import { Button, Card, Field, Input, Textarea, Select, FormError } from "@/components/ui";
import { categoryLabel } from "@/lib/constants";
import { money } from "@/lib/format";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Sending…" : "Send quote"}
    </Button>
  );
}

export function QuoteForm({
  conversationId,
  categories,
}: {
  conversationId: string;
  categories: string[];
}) {
  const action = sendQuote.bind(null, conversationId);
  const [state, formAction] = useFormState<SendQuoteState, FormData>(action, {});
  const [rows, setRows] = useState([
    { label: "", amount: "" },
    { label: "", amount: "" },
  ]);

  const subtotal = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows],
  );

  return (
    <form action={formAction}>
      <Card className="space-y-5">
        <Field label="This quote covers">
          <Select name="category" defaultValue={categories[0] ?? ""}>
            {categories.length === 0 && <option value="">—</option>}
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Line items</span>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                name={`label_${i}`}
                placeholder="e.g. Organic balloon garland"
                className="col-span-8"
                value={r.label}
                onChange={(e) =>
                  setRows((rs) => rs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <Input
                name={`amount_${i}`}
                type="number"
                min={0}
                placeholder="$"
                className="col-span-4"
                value={r.amount}
                onChange={(e) =>
                  setRows((rs) => rs.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
                }
              />
            </div>
          ))}
          {rows.length < 8 && (
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, { label: "", amount: "" }])}
              className="text-sm text-plum-700 hover:underline"
            >
              + Add line
            </button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-plum-50 px-3 py-2 text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-semibold text-slate-900">{money(subtotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Deposit to book" hint="Defaults to 30% if left blank">
            <Input name="deposit" type="number" min={0} placeholder={String(Math.round(subtotal * 0.3))} />
          </Field>
          <Field label="Quote valid until">
            <Input name="expires_at" type="date" />
          </Field>
        </div>

        <Field label="Notes (optional)">
          <Textarea name="notes" rows={3} placeholder="What's included, arrival time, anything the client should know." />
        </Field>

        <FormError message={state.error} />
        <Submit />
      </Card>
    </form>
  );
}
