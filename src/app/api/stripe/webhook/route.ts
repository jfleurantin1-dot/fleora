import { NextResponse } from "next/server";
import { verifyStripeWebhook, type CheckoutSession } from "@/lib/stripe-checkout";
import { reconcileFailedCheckout, reconcilePaidCheckout, reconcileRefundedCharge } from "@/lib/payment-reconcile";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type StripeEvent = { id?: string; type?: string; data?: { object?: any } };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeWebhook(raw, req.headers.get("stripe-signature"))) return new NextResponse("Invalid signature", { status: 400 });
  const event = JSON.parse(raw) as StripeEvent;
  if (!event.id || !event.type) return new NextResponse("Malformed event", { status: 400 });
  const admin = createAdminClient();
  const { error: claimError } = await admin.from("stripe_webhook_events").insert({ stripe_event_id: event.id, event_type: event.type });
  if (claimError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (claimError) return new NextResponse("Could not claim event", { status: 500 });
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (event.data?.object) await reconcilePaidCheckout(event.data.object as CheckoutSession);
    } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      if (event.data?.object) await reconcileFailedCheckout(event.data.object as CheckoutSession);
    } else if (event.type === "charge.refunded") {
      if (event.data?.object) await reconcileRefundedCharge(event.data.object);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    await admin.from("stripe_webhook_events").delete().eq("stripe_event_id", event.id);
    console.error("Stripe webhook processing failed", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}
