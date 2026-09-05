import { createAdminClient } from "@/lib/supabase/server";
import { retrievePaymentReceipt, type CheckoutSession } from "@/lib/stripe-checkout";

export async function recalculateBooking(bookingId: string) {
  const admin = createAdminClient();
  const [{ data: booking }, { data: rows }] = await Promise.all([
    admin.from("bookings").select("*").eq("id", bookingId).single(),
    admin.from("payments").select("amount,refunded_amount,status").eq("booking_id", bookingId),
  ]);
  if (!booking) return;
  const netPaid = (rows ?? []).reduce((sum, row) => {
    if (!["paid", "partially_refunded", "refunded"].includes(row.status)) return sum;
    return sum + Math.max(0, Number(row.amount) - Number(row.refunded_amount ?? 0));
  }, 0);
  const remaining = Math.max(0, Number(booking.total) - netPaid);
  const status = netPaid > 0 ? "confirmed" : booking.status === "cancelled" ? "cancelled" : "pending_deposit";
  await admin.from("bookings").update({ deposit_paid: netPaid, balance: remaining, status }).eq("id", bookingId);
}

export async function reconcilePaidCheckout(session: CheckoutSession) {
  if (session.payment_status !== "paid") return false;
  const admin = createAdminClient();
  const paymentId = session.metadata?.payment_id ?? session.client_reference_id;
  if (!paymentId) return false;
  const { data: payment } = await admin.from("payments").select("*").eq("id", paymentId).single();
  if (!payment) return false;

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : payment.stripe_payment_intent_id ?? null;
  let chargeId = payment.stripe_charge_id ?? null;
  let receiptUrl = payment.receipt_url ?? null;
  if (paymentIntentId && (!chargeId || !receiptUrl)) {
    try {
      const receipt = await retrievePaymentReceipt(paymentIntentId);
      chargeId = receipt.chargeId ?? chargeId;
      receiptUrl = receipt.receiptUrl ?? receiptUrl;
    } catch {}
  }

  const wasPaid = ["paid", "partially_refunded", "refunded"].includes(payment.status);
  await admin.from("payments").update({
    status: "paid", stripe_payment_intent_id: paymentIntentId, stripe_charge_id: chargeId,
    receipt_url: receiptUrl, paid_at: payment.paid_at ?? new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", payment.id);

  if (payment.booking_id) {
    await recalculateBooking(payment.booking_id);
    const { data: booking } = await admin.from("bookings").select("balance").eq("id", payment.booking_id).single();
    const { data: vendor } = await admin.from("vendors").select("user_id").eq("id", payment.vendor_id).single();
    if (vendor?.user_id && !wasPaid) {
      await admin.from("notifications").insert({ user_id: vendor.user_id, kind: "payment", title: "Payment received", body: `${Number(booking?.balance ?? 0) > 0 ? "A booking deposit" : "Payment in full"} was paid through Fleora.`, href: "/vendor/payments" });
    }
  }
  return true;
}

export async function reconcileFailedCheckout(session: CheckoutSession) {
  const admin = createAdminClient();
  const paymentId = session.metadata?.payment_id ?? session.client_reference_id;
  if (!paymentId) return false;
  await admin.from("payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", paymentId).in("status", ["pending", "processing"]);
  return true;
}

export async function reconcileRefundedCharge(charge: { id?: string; amount?: number; amount_refunded?: number; refunded?: boolean; payment_intent?: string | null }) {
  const admin = createAdminClient();
  let query = admin.from("payments").select("*");
  if (charge.id) query = query.eq("stripe_charge_id", charge.id); else if (charge.payment_intent) query = query.eq("stripe_payment_intent_id", charge.payment_intent); else return false;
  const { data: payment } = await query.maybeSingle();
  if (!payment) return false;
  const refundedAmount = Number(charge.amount_refunded ?? 0) / 100;
  const status = refundedAmount >= Number(payment.amount) ? "refunded" : refundedAmount > 0 ? "partially_refunded" : payment.status;
  await admin.from("payments").update({ refunded_amount: refundedAmount, status, updated_at: new Date().toISOString() }).eq("id", payment.id);
  if (payment.booking_id) await recalculateBooking(payment.booking_id);
  return true;
}
