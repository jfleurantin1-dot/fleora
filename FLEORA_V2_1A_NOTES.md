# Fleora V2.1A — Design & UX polish

Included in this build:
- Landing page: removed Plan/Connect/Celebrate, changed CTA to Start Planning, polished feature tiles, replaced hero filler quote.
- Login: real Forgot Password flow + reset password pages using Supabase Auth.
- Dashboard: local-time greeting and removed duplicate At a Glance stats section.
- Inspiration dashboard card reframed as Edit mood board instead of a separate Build This Look feature.
- Client navigation: removed More; mobile uses four-item bottom nav (Home, Vendors, Events, Messages).
- Profile avatar opens Profile & Settings menu.
- Client Profile & Settings: editable name and phone, account email display, password reset link.
- Messages: active quotes are shown before conversations for clients.
- Vendor category emoji displays replaced with unified purple line icons in onboarding, event services, and admin add-vendor.

No database migration is required for this build.

Password reset uses the existing Supabase Auth email system. If reset links do not return to the production app, add the production callback URL / wildcard to Supabase Auth redirect URLs.
