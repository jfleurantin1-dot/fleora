import { NextResponse } from "next/server";
import { verifyStripeWebhook, type CheckoutSession } from "@/lib/stripe-checkout";
import { reconcilePaidCheckout } from "@/lib/payment-reconcile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeWebhook(raw, req.headers.get("stripe-signature"))) return new NextResponse("Invalid signature", { status: 400 });
  const event = JSON.parse(raw) as { type?: string; data?: { object?: CheckoutSession } };
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (event.data?.object) await reconcilePaidCheckout(event.data.object);
  }
  return NextResponse.json({ received: true });
}
