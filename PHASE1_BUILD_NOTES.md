# Fleora — Phase 1 Client Experience Redesign

This build extends the Phase 1 design-system work into the core client experience without changing the existing Supabase database schema.

## Included in this build

- Refined Fleora UI primitives: button variants, card variants, form controls, badges, progress bars, section headers, and stat cards.
- New responsive client navigation with Home, Discover, My Events, Messages, and Profile.
- Redesigned client Home dashboard with an upcoming-event hero, planning progress, budget/vendor/guest/checklist snapshots, quick actions, and a clearly labeled preview for the future Build This Look experience.
- New three-step event creation wizard: celebration type, event details, and visual style/color direction.
- Redesigned service selection step with Fleora recommendations and grouped service cards.
- Redesigned Event Command Center with progress, budget, guests, vendors, checklist, quote review, booked team, and messages.
- Redesigned Discover marketplace with image-forward vendor cards, categories, ratings, starting pricing, and verification/status badges.
- Redesigned event-specific vendor matches with best-match treatment, match score, availability/budget/style signals, and quote actions.
- Redesigned vendor profile with gallery, services, packages, reviews, and event-first CTA.
- Added dedicated My Events and Profile screens.
- Refreshed guest-list and checklist component styling to match the new design language.

## Intentionally not added yet

These features are represented only when explicitly labeled as future/coming soon; no fake backend behavior was added:

- Build This Look / AI image analysis
- Saved vendors / favorites
- Fleora Pay
- Full event budget ledger
- Timeline and invitation modules
- Vendor Pro / external-event CRM

## Verification note

All TypeScript/TSX files were run through TypeScript syntactic transpilation and no syntax diagnostics were found. A full `npm run typecheck` / Next.js production build could not be completed in the artifact environment because dependency installation did not finish successfully. Run `npm ci`, `npm run typecheck`, and `npm run build` locally or in CI before deploying.
