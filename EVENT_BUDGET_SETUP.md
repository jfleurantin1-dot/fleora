# Event budget and invoices

Apply `supabase/migrations/0016_event_budget_invoices.sql` to the active Supabase project before deploying this branch. It adds expense/invoice tables, owner-only row policies and a private 3 MB invoice bucket. Never make this bucket public.

Manual expenses and invoice attachments work without an AI key. To enable optional **Read invoice**, set server-only `OPENAI_API_KEY` in Vercel; `OPENAI_INVOICE_MODEL` optionally overrides the default `gpt-4.1-mini`. Never use a NEXT_PUBLIC key. Reading uses OpenAI Responses with `store: false`. The UI discloses processing and always requires review and save; extracted amounts do not update the budget until confirmed. Payment status is never inferred. Non-USD invoices require a manually entered USD amount.

Bookings are automatically included once; attach an invoice using the booking selector. Edit an existing outside expense to attach another invoice instead of creating a duplicate. Full costs and payments are tracked separately. Cancelled bookings are excluded. The event overview and event cards include outside costs.

Invoices accept PDF/JPEG/PNG/WebP up to 3 MB under the existing 4 MB server-action body limit. Private links expire after five minutes; refresh to renew. Uploads roll back new expenses on failure; editing an existing expense saves its edits even if a subsequent attachment fails (refresh shows the saved values).

Verification before release: apply migration in staging; sign in with two client accounts; confirm each cannot read/edit the other's expense rows or invoices; add a $300 expense with $100 paid and verify committed +$300, paid +$100, due +$200; edit/delete it; attach a PDF to an existing booking and confirm the budget does not increase; test file limits and reading failure/manual fallback; confirm a cancelled booking is excluded; verify extracted invoice total is reviewed before saving.

Automated checks: `npm run test:budget` runs money calculations and the migration against embedded PostgreSQL (PGlite), including owner isolation, same-event attachment checks, private storage access, and payment bounds. This does not replace staging Supabase/Storage or live OpenAI checks.
