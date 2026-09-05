# Fleora Pay 1C.5 — Owner Revenue Dashboard

Adds an admin-only owner money dashboard at `/admin/revenue`.

## What it shows
- Successful Fleora Pay payment volume
- Gross Fleora platform fees earned
- Vendor share
- Recorded refunds
- Stripe platform available balance
- Stripe platform pending balance
- Transaction-level revenue ledger showing client paid / Fleora cut / vendor share
- Current marketplace fee percentage
- Clear Sandbox vs Live Money badge
- Direct buttons to Stripe balance and payout/bank settings

## How payout works
For destination-charge payments, Fleora's application fee remains with the Fleora Stripe platform while the vendor share is routed to the connected vendor. Stripe settles the Fleora platform balance and pays available funds to the bank account configured on the Fleora platform Stripe account.

## Important
Sandbox money is test money and cannot be withdrawn. Before live launch, the Fleora platform Stripe account must have its real bank/payout information completed and live-mode Stripe keys/webhooks must be configured.

## Database
No SQL migration is required for Pay 1C.5. It uses the existing `payments` and `payment_settings` tables from Pay 1A–1C.
