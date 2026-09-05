import Link from "next/link";
import { redirect } from "next/navigation";
import { retrieveCheckoutSession } from "@/lib/stripe-checkout";
import { reconcilePaidCheckout } from "@/lib/payment-reconcile";
import { createAdminClient } from "@/lib/supabase/server";
import { Button, Card } from "@/components/ui";
import { money } from "@/lib/format";

export default async function PaymentSuccess({ searchParams }:{searchParams:{session_id?:string}}) {
  if (!searchParams.session_id) redirect("/dashboard");
  const session = await retrieveCheckoutSession(searchParams.session_id);
  await reconcilePaidCheckout(session);
  const admin = createAdminClient();
  const paymentId = session.metadata?.payment_id ?? session.client_reference_id;
  const { data: payment } = paymentId ? await admin.from("payments").select("*").eq("id", paymentId).single() : {data:null};
  return <main className="mx-auto max-w-xl px-4 py-16"><Card variant="feature" padding="lg" className="text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-2xl">✓</div>
    <p className="mt-5 fleora-kicker">Fleora Pay</p><h1 className="mt-2 font-serif text-3xl text-ink-900">Payment received</h1>
    <p className="mt-3 text-ink-600">Your vendor booking is now confirmed{payment ? ` and ${money(payment.amount)} has been recorded` : ""}.</p>
    <div className="mt-7"><Link href={payment ? `/events/${payment.event_id}` : "/dashboard"}><Button size="lg">Back to your event</Button></Link></div>
  </Card></main>;
}
