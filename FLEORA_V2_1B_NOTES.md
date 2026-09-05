# Fleora V2.1B — Core Marketplace

## Included
- Real vendor search: name/service, category, location, max starting price, date availability.
- Saved/Favorite vendors for clients.
- Message photo attachments (JPG/PNG/WEBP/GIF, 10 MB max) with preview and in-thread images.
- Vendor services/packages can expand with **Add service** / **Add package** (up to 12 each for this MVP).
- In-app notifications for new messages, new leads, new quotes, and quote acceptance/decline.
- Notification bell + notification center.
- Vendor matching now respects manually blocked availability dates as well as bookings.
- Vendor-category emoji instances in event/quote/match screens replaced with the unified line-icon system.

## Supabase setup — REQUIRED
Run `supabase/migrations/0009_marketplace_core.sql` in a NEW Supabase SQL Editor query before testing the new features.

It creates:
- `vendor_favorites`
- `notifications`
- `message-attachments` Storage bucket + policies
- database notification triggers
- updated `match_vendors()` RPC that respects `vendor_unavailable_dates`

## Email notifications
This build creates the in-app notification/event infrastructure. Actual outbound email delivery still needs an email provider (for example Resend) or a Supabase Edge Function + email provider key. Do not treat email delivery as live yet.
