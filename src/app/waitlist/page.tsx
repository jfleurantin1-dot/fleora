"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { joinWaitlist, type WaitlistState } from "./actions";
import { BrandLogo } from "@/components/brand-logo";
import { Button, Card, Field, FormError, Input, Select } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Joining…" : "Join the Waitlist →"}</Button>;
}

export default function WaitlistPage() {
  const [state, action] = useFormState<WaitlistState, FormData>(joinWaitlist, {});
  return (
    <main className="relative min-h-screen overflow-hidden bg-ivory-50 px-5 py-10 sm:px-6">
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-blush-100/60 blur-3xl" />
      <div className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-plum-100/60 blur-3xl" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-between"><Link href="/"><BrandLogo /></Link><Link href="/login" className="text-sm font-semibold text-plum-700 hover:underline">Log in</Link></div>
        <div className="mx-auto mt-14 grid max-w-4xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <section>
            <p className="fleora-kicker">Customer pre-launch</p>
            <h1 className="mt-3 font-display text-5xl leading-[.98] text-ink-900 sm:text-6xl">Your next event is about to get a lot easier.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">Join the Fleora waitlist for early customer access to event planning tools, trusted local vendors, quotes, booking and payments — all in one place.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold text-plum-700"><span className="rounded-full bg-plum-50 px-3 py-2">Plan your event</span><span className="rounded-full bg-plum-50 px-3 py-2">Find local vendors</span><span className="rounded-full bg-plum-50 px-3 py-2">Book & pay securely</span></div>
          </section>
          <Card variant="feature" padding="lg">
            {state.ok ? (
              <div className="py-5 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-plum-50 text-2xl">✓</div><h2 className="mt-5 font-display text-3xl text-ink-900">You’re on the list{state.firstName ? `, ${state.firstName}` : ""}!</h2><p className="mt-3 text-sm leading-relaxed text-ink-600">We’ll email you when Fleora opens customer access. In the meantime, we’re filling the marketplace with local event vendors.</p><Link href="/" className="mt-6 inline-block text-sm font-bold text-plum-700 hover:underline">Back to Fleora</Link></div>
            ) : (
              <><p className="fleora-kicker">Get early access</p><h2 className="mt-2 font-display text-3xl text-ink-900">Join the customer waitlist.</h2><form action={action} className="mt-6 space-y-4"><div className="hidden" aria-hidden="true"><Input name="company" tabIndex={-1} autoComplete="off" /></div><Field label="First name"><Input name="first_name" required /></Field><Field label="Email"><Input name="email" type="email" autoComplete="email" required /></Field><Field label="ZIP code" hint="Helps Fleora prepare local vendors near you."><Input name="postal_code" inputMode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" placeholder="02301" required /></Field><Field label="What are you planning?" hint="Optional"><Select name="event_type" defaultValue=""><option value="">Select an event type</option><option>Birthday</option><option>Baby shower</option><option>Bridal shower</option><option>Graduation</option><option>Dinner / private party</option><option>Corporate event</option><option>Wedding</option><option>Other</option></Select></Field><Field label="Approximate event date" hint="Optional"><Input name="event_date" type="date" /></Field><FormError message={state.error}/><Submit /></form><p className="mt-4 text-center text-xs text-ink-500">Event vendor? <Link href="/signup?as=vendor" className="font-bold text-plum-700 hover:underline">Sign up here</Link>.</p></>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
