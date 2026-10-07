export const BUDGET_CATEGORIES = [
  "Venue",
  "Décor",
  "Food & drink",
  "Entertainment",
  "Rentals",
  "Services",
  "Outfits",
  "Other",
] as const;
export function cents(value: number | string) {
  return Math.round(Number(value) * 100);
}
export function budgetTotals(
  budget: number,
  bookings: Array<{ total: number; balance: number; status: string }>,
  expenses: Array<{ amount: number; paid_amount: number }>,
) {
  const active = bookings.filter((b) => b.status !== "cancelled");
  const total =
    active.reduce((n, b) => n + cents(b.total), 0) +
    expenses.reduce((n, e) => n + cents(e.amount), 0);
  const paid =
    active.reduce(
      (n, b) => n + Math.max(0, cents(b.total) - Math.max(0, cents(b.balance))),
      0,
    ) + expenses.reduce((n, e) => n + cents(e.paid_amount), 0);
  return {
    total: total / 100,
    paid: paid / 100,
    due: (total - paid) / 100,
    remaining: (cents(budget) - total) / 100,
  };
}
export function parseMoney(value: FormDataEntryValue | null): number {
  const raw = String(value ?? "").trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(raw))
    throw new Error("Enter a valid amount with up to two decimal places.");
  return cents(raw) / 100;
}
