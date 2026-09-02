# Fleora

**Imagine it. Plan it. Find it. Book it. Manage it.**

An AI-powered event marketplace. A client describes a celebration, Fleora builds
the plan, matches local vendors, and keeps every quote, message, booking and
payment attached to the event. Vendors get qualified leads with the full brief
attached and a place to run their business.

This repo is the **Phase 1 MVP scaffold** — the "Massachusetts marketplace" slice:

```
client:  sign up → create event → choose services → vendor matches →
         vendor profile → request quote → message → accept quote → booking → dashboard
vendor:  sign up → build profile → receive lead (full brief) → message → send quote → booking
admin:   approve vendors → see events, quotes, bookings, GMV
```

Planning tools included in the scaffold: **checklist** (auto-seeded, with
weeks-before reminders) and **guest list / RSVP**. Not yet built: Fleora Pay,
"Build This Look" AI, vendor CRM for off-platform events, invitations. See
[docs/ROADMAP.md](docs/ROADMAP.md).

---

## Stack

| Concern        | Choice                                             |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 14 (App Router, Server Components/Actions) |
| Language       | TypeScript                                         |
| Styling        | Tailwind CSS                                       |
| DB / Auth / Storage | Supabase (Postgres + RLS, Supabase Auth)      |
| Matching       | Postgres function `match_vendors()` (RPC)          |
| Payments       | _not wired_ — Stripe Connect planned for Phase 3   |

Everything server-side talks to Postgres through Row Level Security. There is no
separate API layer — mutations are Server Actions.

---

## Prerequisites

- **Node.js 20+** and npm  → https://nodejs.org  (this machine has no Node yet)
- **Supabase CLI**         → https://supabase.com/docs/guides/local-development/cli/getting-started
- **Docker Desktop** (only for the *local* Supabase stack)

---

## Getting started (local Supabase)

```bash
# 1. install deps
npm install

# 2. start the local Supabase stack (Postgres, Auth, Studio) — needs Docker
supabase start

# 3. apply migrations + load seed data
supabase db reset

# 4. environment
cp .env.local.example .env.local
#    Fill NEXT_PUBLIC_SUPABASE_URL / ANON KEY / SERVICE_ROLE_KEY from:
supabase status        # prints the local URL + keys

# 5. run
npm run dev            # http://localhost:3000
```

### Demo accounts (password `fleora123`)

| Role   | Email                        | Try                                             |
| ------ | ---------------------------- | ---------------------------------------------- |
| Client | `jerrica@example.com`        | Has a live event "Jerrica's 36th Birthday" with open service requests — go to **Find** on any of them |
| Vendor | `hello@luxeballoons.com`     | Approved decor vendor — will appear in the client's matches |
| Vendor | `hi@petalpressco.com`        | **Pending** — approve it as admin to make it live |
| Admin  | `admin@fleora.app`           | `/admin` — vendor approvals + marketplace metrics |

End-to-end demo:

1. Log in as **jerrica@example.com**, open her event, pick **Decor → Find**.
2. On a match, click **Request quote** → lands in a message thread with the brief pre-filled.
3. Log in as **hello@luxeballoons.com** (separate browser / incognito) → **Leads** → **Send quote**.
4. Back as Jerrica → **View quote** → **Accept & book** → booking shows on the event dashboard.

---

## Using a hosted Supabase project instead

1. Create a project at https://supabase.com.
2. Link and push:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push          # applies supabase/migrations
   ```
   Then run the contents of `supabase/seed.sql` in the SQL editor if you want demo data.
3. In **Authentication → Providers → Email**, disable "Confirm email" for a
   frictionless demo (or keep it on; signup then routes to a "check your inbox" screen).
4. Put the project URL + keys in `.env.local` and deploy (Vercel works out of the box).

---

## Project layout

```
supabase/
  migrations/
    0001_init.sql        tables, enums, triggers (profile provisioning, rating rollup)
    0002_rls.sql         row-level security + helper functions
    0003_matching.sql    match_vendors() + distance + checklist template
  seed.sql               demo users, ~9 MA vendors, services, reviews, a live event

src/
  lib/
    supabase/            server / client / middleware helpers
    auth.ts              getProfile / requireProfile / requireVendor
    constants.ts         service categories + event types (edit here to add categories)
    matching notes       the scoring weights live in 0003_matching.sql
    geo.ts               placeholder town→lat/lng map (swap for real geocoding)
  app/
    (app)/               authenticated area (shared shell + nav)
      dashboard/         client home
      events/…           create, command center, service picker, matches
      vendors/…          public profile, browse
      quotes/[id]        quote detail + accept → booking
      messages/…         thread list + conversation + composer
      vendor/…           onboarding, dashboard, leads, quote builder
      admin/             approvals + metrics
    login, signup, auth/ email/password auth
  components/            ui primitives + event checklist / guest list / message composer
```

## The matching algorithm

`match_vendors(event_id, category)` returns approved vendors that cover the
category, each scored 0–100:

| Component     | Weight | Logic                                                        |
| ------------- | ------ | ----------------------------------------------------------- |
| Availability  | 30%    | penalised if the vendor has a non-cancelled booking that day |
| Location      | 25%    | distance vs. the vendor's service radius (Haversine)         |
| Budget        | 20%    | category starting price vs. the event's overall budget       |
| Style         | 15%    | keyword overlap between event style and vendor description   |
| Reviews       | 10%    | average rating / 5                                           |

Tune the weights and rules in `supabase/migrations/0003_matching.sql`.

## Security notes before production

- `profiles` is currently readable by any authenticated user (needed to render
  names in threads). Tighten to "self + linked vendor/client" before launch.
- RLS policies are an MVP baseline — review `0002_rls.sql` line by line.
- `match_vendors` is `security definer`; it only returns approved vendors and a
  fixed column set, but audit it whenever you change what it selects.
- Add rate limiting on quote requests / messages.

## Scripts

| Command             | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | dev server                               |
| `npm run build`     | production build                         |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm run lint`      | Next lint                               |
| `supabase db reset` | re-apply migrations + reseed (destructive) |
