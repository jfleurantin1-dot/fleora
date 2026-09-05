# Fleora Pay 1A.3 — Stripe onboarding resume fix

This patch fixes the vendor **Continue Stripe setup** flow.

Changes:
- Existing connected accounts no longer perform an account-status fetch before Stripe creates a new hosted onboarding link. This prevents a status-read error from blocking onboarding.
- Accounts v2 status retrieval now builds Stripe's indexed `include[0]`, `include[1]` query string literally.
- No database migration is required.

Test after deploy:
1. Sign in as the same test vendor.
2. Open Payments & Payouts.
3. Click Continue Stripe setup.
4. Stripe hosted onboarding should open.
5. After completing/returning, click Refresh status.
