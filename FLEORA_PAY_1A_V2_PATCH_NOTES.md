# Fleora Pay 1A.1 — Stripe Accounts v2 patch

This patch updates the Connect onboarding foundation to Stripe's current Accounts v2 APIs.

## What changed
- Connected vendors are created with `POST /v2/core/accounts`.
- Fleora uses the `recipient` configuration and requests `stripe_balance.stripe_transfers`, which matches the planned marketplace/destination-charge model where Fleora is merchant of record.
- Stripe-hosted onboarding links now use `POST /v2/core/account_links` and collect Recipient onboarding requirements.
- Vendor payout/readiness state is read from Accounts v2 recipient capabilities and requirements.
- Existing Supabase columns are reused; no new SQL migration is required.

## Required environment variables
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL` (recommended: `https://fleora.vercel.app`)

## Test
Sign in as a vendor → Payments & Payouts → Connect with Stripe. The button should now redirect to Stripe-hosted Recipient onboarding instead of failing on Accounts v1 creation.
