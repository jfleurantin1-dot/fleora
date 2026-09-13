# Fleora waitlist launch changes

Customer homepage calls to action now lead to /waitlist. Vendor signup remains open. Existing users retain login access. Customer signup UI and server action direct new customers to the waitlist.

The waitlist is public. Entries are written by the server-only Supabase service role; the included migration blocks anonymous/authenticated direct table access. Duplicate emails receive the same success response without another confirmation email. Added the missing database type. Default email links use fleoraevents.com.

## Deployment steps
1. Review and merge these files into the current GitHub repository; this ZIP is based on the supplied snapshot, not a fresh GitHub checkout.
2. Inspect any existing customer_waitlist table before applying supabase/migrations/0012_customer_waitlist.sql. Ensure its columns match, and resolve duplicate emails before creating the unique index. Do not reset the production database.
3. Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY on the server. Never expose the service role key in client variables. Set NEXT_PUBLIC_APP_URL=https://fleoraevents.com. Configure RESEND_API_KEY and FLEORA_EMAIL_FROM for confirmation emails.
4. Run npm ci, npm run typecheck, npm run lint, and npm run build, then test a preview deployment.
5. Test logged-out homepage to waitlist, valid submission, duplicate submission, invalid input, vendor signup, existing-user login, and mobile layouts. Confirm entries appear in Supabase and emails arrive.

## Verification and limits
Static checks confirmed public routing, customer signup gate, preserved vendor links, service-role insertion, duplicate email handling, and database type/migration presence. TypeScript and ESLint checks pass (existing image warnings). Dependencies were installed with pnpm for these checks. Full production build, browser QA, database execution and email delivery remain unverified; live credentials are not configured. The installed Next.js version is flagged by the package manager as vulnerable and needs a separate upgrade before public launch.

Before wider promotion, add a privacy notice reflecting your actual data practices and production anti-abuse controls (the existing form currently uses a honeypot only). Account signup through Supabase itself should also be reviewed if customer access must be strictly invitation-only.
