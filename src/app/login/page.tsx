"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, type AuthState } from "./actions";
import { Button, Card, Field, Input, FormError } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Signing in…" : "Welcome back"}</Button>;
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string; check?: string } }) {
  const [state, formAction] = useFormState<AuthState, FormData>(login, {});
  return (
    <main className="relative min-h-screen overflow-hidden bg-ivory-50">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blush-100/60 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-plum-100/70 blur-3xl" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-start font-display text-4xl leading-none text-plum-600">Fleora<span className="ml-1 mt-1 text-sm text-champagne-500">✦</span></Link>
          <p className="mt-10 fleora-kicker">Welcome home</p>
          <h1 className="mt-3 max-w-xl font-display text-6xl leading-[.98] text-ink-900">Your celebration, all in one beautiful place.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">Pick up where you left off, manage your vendors, and keep every detail moving.</p>
        </section>
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-7 inline-flex items-start font-display text-3xl leading-none text-plum-600 lg:hidden">Fleora<span className="ml-1 mt-1 text-xs text-champagne-500">✦</span></Link>
          <Card variant="feature" padding="lg" className="space-y-6">
            <div><p className="fleora-kicker">Sign in</p><h2 className="mt-2 font-display text-4xl text-ink-900">Welcome back.</h2><p className="mt-2 text-sm text-ink-600">Your plans, conversations and bookings are waiting.</p></div>
            {searchParams.check === "1" && <div className="rounded-2xl border border-plum-200 bg-plum-50 px-4 py-3 text-sm font-medium text-plum-800">Check your email to confirm your Fleora account, then come back here to log in.</div>}
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="next" value={searchParams.next ?? "/dashboard"} />
              <Field label="Email"><Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></Field>
              <Field label="Password"><Input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required /></Field>
              <FormError message={state.error} />
              <Submit />
            </form>
            <p className="text-center text-sm text-ink-600">New to Fleora? <Link href="/signup" className="font-semibold text-plum-700 hover:underline">Create an account</Link></p>
          </Card>
          <p className="mt-4 text-center text-[11px] text-ink-400">Demo: jerrica@example.com · password <code>fleora123</code></p>
        </div>
      </div>
    </main>
  );
}
