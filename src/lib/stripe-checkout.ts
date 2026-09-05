import crypto from "crypto";
import { appBaseUrl } from "@/lib/stripe-rest";

const STRIPE_V1 = "https://api.stripe.com/v1";

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY in Vercel.");
  return key;
}

async function stripeForm<T>(path: string, params: URLSearchParams, method: "POST"|"GET" = "POST"): Promise<T> {
  const url = method === "GET" ? `${STRIPE_V1}${path}?${params.toString()}` : `${STRIPE_V1}${path}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${secretKey()}`, ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: method === "POST" ? params.toString() : undefined,
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Stripe request failed.");
  return json as T;
}

export type CheckoutSession = {
  id: string;
  url?: string | null;
  payment_status?: "paid"|"unpaid"|"no_payment_required";
  payment_intent?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string,string> | null;
};

export async function createFleoraCheckout(input: {
  paymentId: string;
  quoteId: string;
  eventId: string;
  vendorId: string;
  vendorStripeAccountId: string;
  label: string;
  amountCents: number;
  feeCents: number;
  currency: string;
}) {
  const base = appBaseUrl();
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("success_url", `${base}/payments/success?session_id={CHECKOUT_SESSION_ID}`);
  p.set("cancel_url", `${base}/quotes/${input.quoteId}?payment=cancelled`);
  p.set("client_reference_id", input.paymentId);
  p.set("line_items[0][price_data][currency]", input.currency);
  p.set("line_items[0][price_data][product_data][name]", input.label);
  p.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  p.set("line_items[0][quantity]", "1");
  p.set("payment_intent_data[application_fee_amount]", String(input.feeCents));
  p.set("payment_intent_data[transfer_data][destination]", input.vendorStripeAccountId);
  p.set("metadata[payment_id]", input.paymentId);
  p.set("metadata[quote_id]", input.quoteId);
  p.set("metadata[event_id]", input.eventId);
  p.set("metadata[vendor_id]", input.vendorId);
  p.set("payment_intent_data[metadata][fleora_payment_id]", input.paymentId);
  return stripeForm<CheckoutSession>("/checkout/sessions", p);
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeForm<CheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`, new URLSearchParams(), "GET");
}

export function verifyStripeWebhook(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  if (!signatureHeader) return false;
  const parts = signatureHeader.split(",").map(part => part.trim().split("="));
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([,v]) => v).filter(Boolean);
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return signatures.some(signature => {
    try { return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex")); } catch { return false; }
  });
}

export async function retrievePaymentReceipt(paymentIntentId: string) {
  const pi = await stripeForm<{ latest_charge?: string | { id?: string } | null }>(`/payment_intents/${encodeURIComponent(paymentIntentId)}`, new URLSearchParams(), "GET");
  const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id;
  if (!chargeId) return { chargeId: null, receiptUrl: null };
  const charge = await stripeForm<{ id: string; receipt_url?: string | null }>(`/charges/${encodeURIComponent(chargeId)}`, new URLSearchParams(), "GET");
  return { chargeId: charge.id, receiptUrl: charge.receipt_url ?? null };
}

export type StripeBalance = {
  available?: Array<{ amount: number; currency: string }>;
  pending?: Array<{ amount: number; currency: string }>;
};

export async function retrievePlatformBalance() {
  return stripeForm<StripeBalance>("/balance", new URLSearchParams(), "GET");
}

export function stripeMode() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") ? "live" : "test";
}

export async function refundFleoraPayment(input: { paymentIntentId: string; amountCents?: number }) {
  const p = new URLSearchParams();
  p.set("payment_intent", input.paymentIntentId);
  if (input.amountCents) p.set("amount", String(input.amountCents));
  p.set("reverse_transfer", "true");
  p.set("refund_application_fee", "true");
  return stripeForm<{ id: string; amount: number; status?: string }>("/refunds", p);
}
