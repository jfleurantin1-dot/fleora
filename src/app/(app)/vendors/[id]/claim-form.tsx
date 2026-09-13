"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestVendorClaim, type ClaimState } from "./actions";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="secondary" className="w-full" disabled={pending}>{pending ? "Sending request…" : "Claim this profile"}</Button>;
}

export function ClaimForm({ vendorId }: { vendorId: string }) {
  const bound = requestVendorClaim.bind(null, vendorId);
  const [state, action] = useFormState<ClaimState, FormData>(bound, {});

  return (
    <form action={action} className="space-y-3">
      <Field label="Your role"><Select name="relationship" required defaultValue=""><option value="" disabled>Choose your role…</option><option value="owner">Owner</option><option value="employee">Employee</option><option value="authorized_manager">Authorized manager</option><option value="agency">Agency or representative</option></Select></Field>
      <Field label="Business email" hint="Use an address connected to the business when possible."><Input name="business_email" type="email" placeholder="you@business.com" /></Field>
      <Field label="Verification link" hint="Business website, Instagram profile, or another page showing your connection."><Input name="proof_url" type="url" placeholder="https://…" /></Field>
      <Field label="Anything else?" hint="Optional"><Textarea name="note" rows={3} placeholder="Add context that will help Fleora review your request." /></Field>
      <FormError message={state.error} />
      {state.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Claim request sent. Fleora will verify the information before transferring the profile.</p>
      ) : <Submit />}
    </form>
  );
}
