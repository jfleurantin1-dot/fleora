"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signup, type SignupState } from "./actions";
import { Button, Card, Field, Input, FormError } from "@/components/ui";

function Submit({ isVendor }: { isVendor: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Creating your account…" : isVendor ? "Create vendor account" : "Start planning"}</Button>;
}

export default function SignupPage({ searchParams }: { searchParams: { as?: string } }) {
  const [state, formAction] = useFormState<SignupState, FormData>(signup, {});
  const [accountType, setAccountType] = useState(searchParams.as === "vendor" ? "vendor" : "client");
  const isVendor = accountType === "vendor";
  return (
    <main className="relative min-h-screen overflow-hidden bg-ivory-50">
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-blush-100/60 blur-3xl" />
      <div className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-plum-100/60 blur-3xl" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-start font-display text-4xl leading-none text-plum-600">Fleora<span className="ml-1 mt-1 text-sm text-champagne-500">✦</span></Link>
          <p className="mt-10 fleora-kicker">Create your space</p>
          <h1 className="mt-3 max-w-xl font-display text-6xl leading-[.98] text-ink-900">Plan beautifully. Grow beautifully.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">Whether you’re planning a celebration or running an event business, Fleora keeps the experience thoughtful and organized. organized.</p>
        </section>
        <div className="mx-auto w-full max-w-lg">
          <Link href="/" className="mb-7 inline-flex items-start font-display text-3xl leading-none text-plum-600 lg:hidden">Fleora<span className="ml-1 mt-1 text-xs text-champagne-500">✦</span></Link>
          <Card variant="feature" padding="lg" className="space-y-6">
            <div><p className="fleora-kicker">Join Fleora</p><h2 className="mt-2 font-display text-4xl text-ink-900">{isVendor ? "Grow your event business." : "Let’s plan something beautiful."}</h2></div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ivory-100 p-1.5">
              {(["client", "vendor"] as const).map((t) => <button key={t} type="button" onClick={() => setAccountType(t)} className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${accountType===t ? "bg-white text-plum-700 shadow-sm" : "text-ink-500 hover:text-plum-700"}`}>{t === "client" ? "Planning an event" : "I’m a vendor"}</button>)}
            </div>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="account_type" value={accountType} />
              <div className="grid grid-cols-2 gap-3"><Field label="First name"><Input name="first_name" required /></Field><Field label="Last name"><Input name="last_name" /></Field></div>
              <Field label="Email"><Input name="email" type="email" autoComplete="email" required /></Field>
              <Field label="Password" hint="At least 6 characters"><Input name="password" type="password" autoComplete="new-password" required minLength={6} /></Field>
              <FormError message={state.error} />
              <Submit isVendor={isVendor} />
            </form>
            <p className="text-center text-sm text-ink-600">Already have an account? <Link href="/login" className="font-semibold text-plum-700 hover:underline">Log in</Link></p>
          </Card>
        </div>
      </div>
    </main>
  );
}
