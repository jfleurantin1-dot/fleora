import { createAdminClient } from "@/lib/supabase/server";
import { retrievePaymentReceipt, type CheckoutSession } from "@/lib/stripe-checkout";

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
    } catch {
      // Receipt enrichment should never block booking reconciliation.
    }
  }

  const wasPaid = payment.status === "paid";
  await admin.from("payments").update({
    status: "paid",
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: chargeId,
    receipt_url: receiptUrl,
    paid_at: payment.paid_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", payment.id);

  if (payment.booking_id) {
    const [{ data: booking }, { data: paidRows }] = await Promise.all([
      admin.from("bookings").select("*").eq("id", payment.booking_id).single(),
      admin.from("payments").select("amount").eq("booking_id", payment.booking_id).eq("status", "paid"),
    ]);
    if (booking) {
      const totalPaid = (paidRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
      const remaining = Math.max(0, Number(booking.total) - totalPaid);
      await admin.from("bookings").update({ deposit_paid: totalPaid, balance: remaining, status: "confirmed" }).eq("id", booking.id);
      const { data: vendor } = await admin.from("vendors").select("user_id,business_name").eq("id", payment.vendor_id).single();
      if (vendor?.user_id && !wasPaid) {
        await admin.from("notifications").insert({ user_id: vendor.user_id, kind: "payment", title: "Payment received", body: `${remaining > 0 ? "A booking deposit" : "Payment in full"} was paid through Fleora.`, href: "/vendor/payments" });
      }
    }
  }
  return true;
}
