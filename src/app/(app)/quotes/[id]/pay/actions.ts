"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createFleoraCheckout } from "@/lib/stripe-checkout";

function cents(value: number) { return Math.round(Number(value) * 100); }

export async function startQuotePayment(quoteId: string, type: "deposit"|"full"|"balance") {
  const profile = await requireProfile();
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  if (!quote || quote.status !== "accepted") throw new Error("This quote is not ready for payment.");
  const [{ data: event }, { data: vendor }, { data: booking }, { data: settings }] = await Promise.all([
    supabase.from("events").select("id,name,client_id").eq("id", quote.event_id).single(),
    supabase.from("vendors").select("id,business_name,stripe_account_id,stripe_onboarding_status,stripe_transfers_status").eq("id", quote.vendor_id).single(),
    supabase.from("bookings").select("*").eq("quote_id", quote.id).single(),
    supabase.from("payment_settings").select("*").eq("id", 1).single(),
  ]);
  if (!event || event.client_id !== profile.id) throw new Error("Only the event owner can pay this quote.");
  if (!vendor?.stripe_account_id) throw new Error("This vendor has not connected Stripe yet.");
  if (!booking) throw new Error("Booking record not found. Please accept the quote again or contact Fleora support.");

  const alreadyPaid = Number(booking.deposit_paid ?? 0);
  const balance = Math.max(0, Number(booking.total) - alreadyPaid);
  let amount = type === "full" ? Number(quote.total) : type === "balance" ? balance : Number(quote.deposit || 0);
  if (type === "deposit" && amount <= 0) amount = Number(quote.total);
  if (type === "full" && alreadyPaid > 0) amount = balance;
  if (amount <= 0) redirect(`/quotes/${quote.id}?payment=already_paid`);

  const feeBps = Number(settings?.platform_fee_bps ?? 800);
  const fee = Math.round(amount * feeBps) / 10000;
  const effectiveType = alreadyPaid > 0 ? "balance" : (type === "deposit" && amount < Number(quote.total) ? "deposit" : "full");
  const { data: payment, error } = await admin.from("payments").insert({
    booking_id: booking.id, quote_id: quote.id, event_id: quote.event_id, vendor_id: quote.vendor_id,
    client_id: profile.id, payment_type: effectiveType, status: "pending", amount,
    platform_fee: fee, vendor_net: Math.max(0, amount - fee), currency: settings?.currency ?? "usd",
  }).select("*").single();
  if (error || !payment) throw new Error(error?.message ?? "Could not start payment.");

  const session = await createFleoraCheckout({
    paymentId: payment.id, quoteId: quote.id, eventId: quote.event_id, vendorId: quote.vendor_id,
    vendorStripeAccountId: vendor.stripe_account_id,
    label: `${event.name} — ${vendor.business_name} (${effectiveType === "deposit" ? "Deposit" : effectiveType === "balance" ? "Balance" : "Full payment"})`,
    amountCents: cents(amount), feeCents: cents(fee), currency: settings?.currency ?? "usd",
  });
  await admin.from("payments").update({ stripe_checkout_session_id: session.id, status: "processing", updated_at: new Date().toISOString() }).eq("id", payment.id);
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  redirect(session.url);
}
