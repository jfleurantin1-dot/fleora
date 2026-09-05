import { NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth";
import { appBaseUrl, createOnboardingLink } from "@/lib/stripe-rest";

export async function GET() {
  const { vendor } = await requireVendor();
  if (!vendor?.stripe_account_id) return NextResponse.redirect(`${appBaseUrl()}/vendor/payments`);
  const link = await createOnboardingLink(vendor.stripe_account_id, appBaseUrl());
  return NextResponse.redirect(link.url);
}
