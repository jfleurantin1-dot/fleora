"use server";

import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { accountState, appBaseUrl, createFleoraConnectedAccount, createOnboardingLink, retrieveConnectedAccount } from "@/lib/stripe-rest";

async function saveStripeState(vendorId: string, account: Awaited<ReturnType<typeof retrieveConnectedAccount>>) {
  const state = accountState(account);
  const admin = createAdminClient();
  await admin.from("vendors").update({
    stripe_account_id: account.id,
    stripe_onboarding_status: state.onboardingStatus,
    stripe_details_submitted: state.detailsSubmitted,
    stripe_charges_enabled: state.chargesEnabled,
    stripe_payouts_enabled: state.payoutsEnabled,
    stripe_transfers_status: state.transfersStatus,
    stripe_last_synced_at: new Date().toISOString(),
  }).eq("id", vendorId);
  return state;
}

export async function startStripeOnboarding() {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let accountId = vendor.stripe_account_id;

  if (!accountId) {
    const account = await createFleoraConnectedAccount({
      vendorId: vendor.id,
      businessName: vendor.business_name,
      email: vendor.contact_email ?? user?.email ?? null,
    });
    accountId = account.id;
    await saveStripeState(vendor.id, account);
  } else {
    const account = await retrieveConnectedAccount(accountId);
    await saveStripeState(vendor.id, account);
  }

  const link = await createOnboardingLink(accountId, appBaseUrl());
  redirect(link.url);
}

export async function refreshStripeStatus() {
  const { vendor } = await requireVendor();
  if (!vendor?.stripe_account_id) redirect("/vendor/payments");
  const account = await retrieveConnectedAccount(vendor.stripe_account_id);
  await saveStripeState(vendor.id, account);
  redirect("/vendor/payments?stripe=synced");
}
