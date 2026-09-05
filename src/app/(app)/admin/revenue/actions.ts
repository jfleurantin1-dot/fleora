"use server";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { refundFleoraPayment } from "@/lib/stripe-checkout";
import { recalculateBooking } from "@/lib/payment-reconcile";

export async function refundPayment(formData: FormData) {
  const profile = await requireProfile("/admin/revenue");
  if (profile.account_type !== "admin") throw new Error("Admin access required.");
  const paymentId = String(formData.get("payment_id") ?? "");
  const admin = createAdminClient();
  const { data: payment } = await admin.from("payments").select("*").eq("id", paymentId).single();
  if (!payment || !payment.stripe_payment_intent_id || !["paid", "partially_refunded"].includes(payment.status)) throw new Error("This payment cannot be refunded.");
  const remaining = Math.max(0, Number(payment.amount) - Number(payment.refunded_amount ?? 0));
  if (remaining <= 0) throw new Error("This payment is already fully refunded.");
  await refundFleoraPayment({ paymentIntentId: payment.stripe_payment_intent_id });
  await admin.from("payments").update({ status: "refunded", refunded_amount: Number(payment.amount), updated_at: new Date().toISOString() }).eq("id", payment.id);
  if (payment.booking_id) await recalculateBooking(payment.booking_id);
  const { data: vendor } = await admin.from("vendors").select("user_id").eq("id", payment.vendor_id).single();
  if (vendor?.user_id) await admin.from("notifications").insert({ user_id: vendor.user_id, kind: "payment", title: "Payment refunded", body: "A Fleora payment was refunded to the client.", href: "/vendor/payments" });
  await admin.from("notifications").insert({ user_id: payment.client_id, kind: "payment", title: "Refund issued", body: "Fleora issued a refund through Stripe. Your bank may take time to post it.", href: "/payments" });
  revalidatePath("/admin/revenue"); revalidatePath("/payments"); revalidatePath("/vendor/payments");
}
