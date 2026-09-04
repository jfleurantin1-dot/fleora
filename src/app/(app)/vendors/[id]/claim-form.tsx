"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestVendorClaim, type ClaimState } from "./actions";
import { Button, FormError, Textarea } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="secondary" className="w-full" disabled={pending}>{pending ? "Sending request…" : "Claim this profile"}</Button>;
}

export function ClaimForm({ vendorId }: { vendorId: string }) {
  const bound = requestVendorClaim.bind(null, vendorId);
  const [state, action] = useFormState<ClaimState, FormData>(bound, {});

  return (
    <form action={action} className="space-y-3">
      <Textarea name="note" rows={3} placeholder="Tell us your role at this business or add a verification note (optional)." />
      <FormError message={state.error} />
      {state.ok ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Claim request sent. Fleora will review it before transferring the profile.</p>
      ) : <Submit />}
    </form>
  );
}
