import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";
import { budgetTotals } from "@/lib/budget";
import { money } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";
import { ExpenseForm, ExpenseControls, RemoveInvoice } from "./expense-form";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const s = createClient();
  const { data: event } = await s
    .from("events")
    .select("*")
    .eq("id", params.id)
    .eq("client_id", profile.id)
    .single();
  if (!event) notFound();
  const [expensesResult, bookingsResult, invoicesResult] = await Promise.all([
    s
      .from("event_budget_expenses")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at"),
    s
      .from("bookings")
      .select("*")
      .eq("event_id", event.id)
      .neq("status", "cancelled"),
    s
      .from("event_budget_invoices")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at"),
  ]);
  if (expensesResult.error || bookingsResult.error || invoicesResult.error)
    return (
      <div className="space-y-7">
        <EventWorkspaceHeader
          event={event}
          active="/budget"
          eyebrow="Event workspace"
        />
        <Card>
          <h1 className="font-display text-3xl">Budget unavailable</h1>
          <p className="mt-3">
            We couldn’t load your budget. Please try again shortly.
          </p>
        </Card>
      </div>
    );
  const expenses = expensesResult.data ?? [];
  const bookings = bookingsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const totals = budgetTotals(Number(event.budget ?? 0), bookings, expenses);
  const readerEnabled = Boolean(process.env.OPENAI_API_KEY);
  const eventId = event.id;
  const vendorIds = [...new Set(bookings.map((b) => b.vendor_id))];
  const { data: vendors } = vendorIds.length
    ? await s.from("vendors").select("id,business_name").in("id", vendorIds)
    : { data: [] };
  const names = new Map((vendors ?? []).map((v) => [v.id, v.business_name]));
  const invoiceLinks = await Promise.all(
    invoices.map(async (i) => {
      const { data } = await s.storage
        .from("event-invoices")
        .createSignedUrl(i.storage_path, 300);
      return { ...i, url: data?.signedUrl };
    }),
  );
  const categories = new Map<string, number>();
  for (const e of expenses)
    categories.set(
      e.category,
      (categories.get(e.category) ?? 0) + Math.round(Number(e.amount) * 100),
    );
  for (const b of bookings) {
    const c = categoryLabel(b.category);
    categories.set(
      c,
      (categories.get(c) ?? 0) + Math.round(Number(b.total) * 100),
    );
  }
  function attachments(expenseId: string | null, bookingId: string | null) {
    return invoiceLinks
      .filter((i) =>
        expenseId ? i.expense_id === expenseId : i.booking_id === bookingId,
      )
      .map((i) => (
        <div
          key={i.id}
          className="mt-2 flex flex-wrap items-center gap-2 text-sm"
        >
          {i.url ? (
            <a
              href={i.url}
              target="_blank"
              rel="noreferrer"
              className="text-plum-700 underline"
            >
              {i.filename}
            </a>
          ) : (
            <span>{i.filename} — temporarily unavailable</span>
          )}
          <RemoveInvoice eventId={eventId} id={i.id} />
        </div>
      ));
  }
  return (
    <div className="space-y-7">
      <EventWorkspaceHeader
        event={event}
        active="/budget"
        eyebrow="Event workspace"
      />
      <div>
        <h1 className="font-display text-4xl">Your budget</h1>
        <p className="mt-2 text-sm text-ink-600">
          Vendor bookings and outside expenses, together in one place.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Event budget", value: Number(event.budget ?? 0) },
          { label: "Total committed", value: totals.total },
          { label: "Paid", value: totals.paid },
          { label: "Balance due", value: totals.due },
          {
            label: totals.remaining < 0 ? "Over budget" : "Budget remaining",
            value: Math.abs(totals.remaining),
          },
        ].map((t) => (
          <Card key={t.label}>
            <p className="text-xs text-ink-500">{t.label}</p>
            <p className="mt-2 text-xl font-semibold">{money(t.value)}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="mb-4 font-display text-2xl">
          Add an expense or invoice
        </h2>
        <ExpenseForm
          eventId={event.id}
          readerEnabled={readerEnabled}
          bookings={bookings.map((b) => ({
            id: b.id,
            label: names.get(b.vendor_id) ?? categoryLabel(b.category),
          }))}
        />
      </Card>
      <section>
        <h2 className="mb-3 font-display text-2xl">Budget sheet</h2>
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {names.get(b.vendor_id) ?? "Vendor"}
                  </h3>
                  <p className="text-sm text-ink-500">
                    {categoryLabel(b.category)} · Fleora booking
                  </p>
                </div>
                <div className="text-sm">
                  <strong>{money(b.total)}</strong>
                  <p>
                    {money(Math.max(0, Number(b.total) - Number(b.balance)))}{" "}
                    paid · {money(Math.max(0, Number(b.balance)))} due
                  </p>
                  <Link
                    className="text-plum-700 underline"
                    href={`/quotes/${b.quote_id}`}
                  >
                    View quote / payments
                  </Link>
                </div>
              </div>
              {attachments(null, b.id)}
            </Card>
          ))}
          {expenses.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{e.description}</h3>
                  <p className="text-sm text-ink-500">
                    {e.category}
                    {e.vendor_name ? ` · ${e.vendor_name}` : ""}
                  </p>
                </div>
                <div className="text-sm">
                  <strong>{money(e.amount)}</strong>
                  <p>
                    {money(e.paid_amount)} paid ·{" "}
                    {money(Number(e.amount) - Number(e.paid_amount))} due
                  </p>
                </div>
              </div>
              {attachments(e.id, null)}
              <ExpenseControls
                eventId={event.id}
                expense={e}
                readerEnabled={readerEnabled}
              />
            </Card>
          ))}
          {!bookings.length && !expenses.length && (
            <Card>
              <p>
                No expenses yet. Add a cost above or accept a vendor quote to
                get started.
              </p>
            </Card>
          )}
        </div>
      </section>
      {categories.size > 0 && (
        <Card>
          <h2 className="mb-3 font-display text-2xl">By category</h2>
          <dl className="space-y-2">
            {Array.from(categories).map(([c, total]) => (
              <div key={c} className="flex justify-between gap-4">
                <dt>{c}</dt>
                <dd className="font-semibold">{money(total / 100)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </div>
  );
}
