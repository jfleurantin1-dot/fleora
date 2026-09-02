"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signup, type SignupState } from "./actions";
import { Button, Card, Field, Input, FormError } from "@/components/ui";

function Submit({ isVendor }: { isVendor: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : isVendor ? "Create vendor account" : "Create account"}
    </Button>
  );
}

export default function SignupPage({ searchParams }: { searchParams: { as?: string } }) {
  const [state, formAction] = useFormState<SignupState, FormData>(signup, {});
  const [accountType, setAccountType] = useState(searchParams.as === "vendor" ? "vendor" : "client");
  const isVendor = accountType === "vendor";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-6 text-lg font-semibold text-plum-700">
        🌸 Fleora
      </Link>
      <Card className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">
          {isVendor ? "List your business on Fleora" : "Start planning your event"}
        </h1>

        <div className="grid grid-cols-2 gap-2">
          {(["client", "vendor"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAccountType(t)}
              className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                accountType === t
                  ? "bg-plum-600 text-white ring-plum-600"
                  : "bg-white text-slate-600 ring-plum-200 hover:bg-plum-50"
              }`}
            >
              {t === "client" ? "I'm planning an event" : "I'm a vendor"}
            </button>
          ))}
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="account_type" value={accountType} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input name="first_name" required />
            </Field>
            <Field label="Last name">
              <Input name="last_name" />
            </Field>
          </div>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password" hint="At least 6 characters">
            <Input name="password" type="password" autoComplete="new-password" required minLength={6} />
          </Field>
          <FormError message={state.error} />
          <Submit isVendor={isVendor} />
        </form>

        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-plum-700 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
