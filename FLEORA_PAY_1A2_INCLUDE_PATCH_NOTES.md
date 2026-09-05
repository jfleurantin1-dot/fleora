# Fleora Pay 1A.2 — Stripe Accounts v2 include parameter patch

Fixes Stripe Accounts v2 resume-onboarding / status refresh requests. Stripe v2 does not accept the legacy `include[]` query syntax; it requires indexed query parameters such as `include[0]`, `include[1]`, etc.

No Supabase migration is required.
