# Fleora Pay 1D — Payment Protection & Refunds

## Included
- Webhook replay/idempotency protection using `stripe_webhook_events`.
- Stripe signature timestamp tolerance (5 minutes) and support for multiple v1 signatures.
- Failed/expired Checkout sessions mark open Fleora payments failed.
- 30-minute duplicate-checkout guard per booking.
- Admin full-refund control on the Fleora Revenue ledger.
- Refunds reverse the destination transfer and refund the application fee through Stripe.
- Booking paid/balance totals recalculate using net paid after refunds.
- `charge.refunded` webhook support keeps Fleora synced with refunds made in Stripe.
- Client/vendor refund notifications.

## Stripe webhook events
Keep the existing events and add:
- `charge.refunded`
- `checkout.session.expired`

`checkout.session.async_payment_failed` was already selected during Pay 1B setup and is now handled.

## Migration
Run `supabase/migrations/0014_fleora_pay_protection.sql` once in a NEW Supabase SQL query.

## Test in Sandbox
1. Successful payment still reconciles normally.
2. Double-clicking payment creation should not create two fresh checkouts within 30 minutes.
3. In Admin > Fleora revenue, refund a paid sandbox transaction.
4. Confirm Stripe shows the refund, Fleora marks it Refunded, and the booking balance increases accordingly.
5. Resend the same Stripe webhook event: it should return 200 and not apply money twice.

## Safety note
Remain in Stripe Sandbox for this phase. Do not enable live client payments until these tests pass.
