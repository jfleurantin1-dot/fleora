# Deploying Fleora

Getting the app online means setting up **two hosted services** and pointing them
at each other:

| Piece            | Service            | Free tier | What it holds                          |
| ---------------- | ------------------ | --------- | ------------------------------------- |
| Database + login | **Supabase**       | Yes       | Every table, every user account       |
| The website      | **Vercel**         | Yes       | The Next.js app, rebuilt on every push |

> **Before the first deploy succeeds:** this codebase has not been compiled yet.
> Expect the first build to fail with a few TypeScript errors. Send the build log
> to Claude and they'll be fixed — this is normal for a fresh scaffold.

You'll need: a GitHub account (done — the repo is pushed), a Supabase account, and
a Vercel account. Sign into both with "Continue with GitHub".

---

## Step 1 — Supabase (the database)

1. Go to <https://supabase.com> → **New project**.
   - Name: `fleora`
   - Database password: generate one and **save it somewhere** (you rarely need it,
     but you can't recover it).
   - Region: pick the one closest to your users (e.g. **East US (North Virginia)**).
   - Wait ~2 minutes for it to finish setting up.

2. **Run the schema.** In the left sidebar: **SQL Editor** → **+ New query**.
   Open each file below from this repo, copy its entire contents into the editor,
   and click **Run**. Do them **in this order**:

   1. `supabase/migrations/0001_init.sql`  (tables)
   2. `supabase/migrations/0002_rls.sql`   (security rules)
   3. `supabase/migrations/0003_matching.sql`  (vendor matching function)

   Each should finish with "Success. No rows returned".

3. **(Optional) Load demo data.** Run `supabase/seed.sql` the same way. This adds
   ~9 example Massachusetts vendors, a demo event, and these logins (password
   `fleora123` for all):
   - `jerrica@example.com` — client with a live event
   - `hello@luxeballoons.com` — approved vendor
   - `admin@fleora.app` — admin
   Skip this step if you want to launch with a clean, empty marketplace.

4. **Copy your keys.** Left sidebar → **Project Settings** (gear) → **API**:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **`anon` `public`** key — a long string
   - **`service_role` `secret`** key — another long string (keep this one private)

5. **(Recommended for a smooth demo)** **Authentication** → **Providers** → **Email**
   → turn **off** "Confirm email". Otherwise every new signup has to click a link in
   their inbox before they can log in. You can turn it back on later.

---

## Step 2 — Vercel (the website)

1. Go to <https://vercel.com> → sign in with GitHub → **Add New… → Project**.
2. Find **`fleora`** in the repo list → **Import**.
3. Vercel auto-detects Next.js. Leave the build settings alone.
4. Expand **Environment Variables** and add these four (name on the left, value on
   the right):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `anon` `public` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your `service_role` `secret` key |
   | `NEXT_PUBLIC_SITE_URL` | `https://fleora.vercel.app` (a placeholder — you'll fix it in Step 3) |

5. Click **Deploy**.
   - **If it succeeds:** you'll get a URL like `https://fleora-abc123.vercel.app`.
   - **If it fails:** open the deployment → **Building** log → copy the red error
     text → send it to Claude. Fix, `git push`, Vercel redeploys automatically.

---

## Step 3 — Connect them (auth redirects)

Login won't work until Supabase knows your real website address.

1. Copy your live Vercel URL from Step 2.
2. **In Vercel:** Project → **Settings → Environment Variables** → edit
   `NEXT_PUBLIC_SITE_URL` to that exact URL (no trailing slash) → **Save**.
   Then **Deployments → … → Redeploy**.
3. **In Supabase:** **Authentication → URL Configuration**:
   - **Site URL:** `https://your-real-vercel-url`
   - **Redirect URLs:** add both:
     - `https://your-real-vercel-url/auth/callback`
     - `https://your-real-vercel-url/**`

---

## Step 4 — Test it

1. Open your Vercel URL.
2. **Sign up** as a client → create an event → walk through choosing services and
   viewing matches. (Matches only appear if you loaded the seed data in Step 1.3,
   or after you add real vendors.)
3. **Make yourself an admin:** sign up, then in Supabase → **Table Editor** →
   `profiles` → find your row → set `account_type` to `admin`. Reload the app;
   you'll now have `/admin`.

---

## After launch

- **Every `git push` redeploys automatically.** Edit code → `git add -A` →
  `git commit -m "..."` → `git push` → live in ~1 minute.
- **Custom domain** (e.g. `fleora.com`): buy it anywhere, then Vercel → Project →
  **Settings → Domains** → add it and follow the DNS instructions. Update
  `NEXT_PUBLIC_SITE_URL` and the Supabase redirect URLs to match.
- **Schema changes later:** add a new file to `supabase/migrations/` and run it in
  the Supabase SQL Editor, same as Step 1.2.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Vercel build fails | Send Claude the red error from the build log. |
| "Invalid API key" / login does nothing | Re-check the three Supabase env vars in Vercel, then redeploy. |
| Confirmation email never arrives | Turn off "Confirm email" (Step 1.5), or check spam. |
| "permission denied for table…" | Migration `0002_rls.sql` didn't run — run it in the SQL Editor. |
| Redirect to `localhost` after login | `NEXT_PUBLIC_SITE_URL` still points at localhost — fix it (Step 3.2). |
