# Fleora Pay 1A.4 — Stripe Accounts v2 query fix

- Removes the unsupported `include` array from the Accounts v2 create-account JSON body.
- Encodes indexed GET include parameters with `URLSearchParams` (`include%5B0%5D`, `include%5B1%5D`) to match Stripe Accounts v2 requirements.
- Stops automatically fetching Stripe account status on every onboarding return; status refresh remains an explicit vendor action.
- No Supabase migration is required.
