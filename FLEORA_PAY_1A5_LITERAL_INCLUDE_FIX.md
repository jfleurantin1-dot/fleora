# Fleora Pay 1A.5 — Stripe Accounts v2 literal include fix

This patch fixes the vendor **Refresh status** request for Stripe Accounts v2.

Stripe documents indexed query parameters as `include[0]=...`, `include[1]=...`. The previous implementation used `URLSearchParams`, which percent-encoded the square brackets. This patch sends the indexed query keys literally, matching Stripe's documented request format.

No Supabase migration is required.

Test after deployment:
1. Vendor → Payments & Payouts → Refresh status.
2. Vendor → Continue Stripe setup.
3. Complete sandbox onboarding and return to Fleora.
