"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, type AuthState } from "./actions";
import { Button, Card, Field, Input, FormError } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Log in"}
    </Button>
  );
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const [state, formAction] = useFormState<AuthState, FormData>(login, {});

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-6 text-lg font-semibold text-plum-700">
        🌸 Fleora
      </Link>
      <Card className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={searchParams.next ?? "/dashboard"} />
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <FormError message={state.error} />
          <Submit />
        </form>
        <p className="text-sm text-slate-500">
          New to Fleora?{" "}
          <Link href="/signup" className="font-medium text-plum-700 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
      <p className="mt-4 text-center text-xs text-slate-400">
        Demo login: jerrica@example.com · admin@fleora.app · hello@luxeballoons.com — password{" "}
        <code>fleora123</code>
      </p>
    </main>
  );
}
