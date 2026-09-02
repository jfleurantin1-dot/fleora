# Fleora roadmap

The scaffold in this repo is **Phase 1**. This file maps the full product vision
onto build phases so scope stays honest.

## Phase 1 — Prove the marketplace  ✅ (this repo)

- Auth (client / vendor / admin)
- Client: create event → choose services → **vendor matching** → profiles →
  request quote → messaging → accept quote → booking → event dashboard
- Vendor: profile/onboarding → qualified leads (full brief) → messaging → send quote → bookings
- Admin: approve vendors, marketplace metrics
- Planning starters: auto-seeded checklist, guest list + RSVP

**Success metric:** real MA clients creating events and booking ≥1 vendor.

## Phase 2 — Make it addictive

- Client
  - Budget tracker with over-budget alerts (data model already supports it)
  - Timeline view (derived from checklist + booking dates)
  - Inspiration board uploads → **"Build This Look"** (AI image analysis →
    shopping list with quantities scaled to guest count; affiliate links)
  - Menu / food planning tied to caterer package sizing
- Vendor
  - Calendar (all events, not just Fleora)
  - Event management record per booking
  - Off-platform bookings ("Vendor Pro" subscription)

New tables to add: `inspiration_images`, `look_items`, `event_timeline`,
`menu_items`, `vendor_calendar_events`, `subscriptions`.

## Phase 3 — Event operating system

- **Fleora Pay**
  - V1: individual vendor deposit/balance payments (Stripe)
  - V1.5: "Pay for my event" — one checkout, split to vendors (Stripe Connect
    destination charges)
  - V2: consolidated Fleora payment schedule across all vendor obligations
  - V3: third-party installments (Affirm via Stripe) — Fleora never becomes a lender
  - Requires a payments attorney review of merchant-of-record / chargeback liability
- Contracts + e-sign
- Invitations + RSVP delivery (email/SMS)
- Vendor CRM: invoices, staff, client history, analytics
- "Plan my entire event" — budget → category allocation → auto-matched vendors

## Non-negotiable architecture decisions carried from day one

- The **event** is the central object; everything hangs off it.
- Money never lands in a plain company account — Stripe Connect from the start of Phase 3.
- Vendor data (categories, pricing, availability) is **structured**, never "DM for pricing".
