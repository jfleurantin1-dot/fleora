# Fleora Pay 1B.1 — Stripe Webhook 307 Fix

## Fix
Stripe webhook deliveries were receiving HTTP 307 redirects because the global Supabase auth middleware treated `/api/stripe/webhook` as a protected route and redirected unauthenticated Stripe requests to `/login`.

The Stripe webhook route is now explicitly exempted from session gating. Security is still enforced by Stripe webhook signature verification in `src/app/api/stripe/webhook/route.ts` using `STRIPE_WEBHOOK_SECRET`.

## Expected result
After deployment, Stripe deliveries to `/api/stripe/webhook` should receive a 2xx response rather than 307. A successful `checkout.session.completed` delivery will allow Fleora to reconcile the payment and move the deposit from pending to paid.

## SQL
No Supabase migration is required.
