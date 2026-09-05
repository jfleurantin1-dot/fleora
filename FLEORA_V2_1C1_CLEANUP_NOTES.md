# Fleora V2.1C.1 — Event Planning Cleanup

This cleanup pass fixes the issues found while testing V2.1C:

- Mood Board photos now preview immediately and upload from Edit Event without requiring a page change.
- Added clear uploading/saved feedback for Mood Board photo changes.
- RSVP links are public in middleware; guests do not need a Fleora account.
- Forgot/reset-password routes are also explicitly public.
- Redesigned “Your Event Team” cards with larger icons, less repetitive purple, and sage/blush status states.
- Added a single Event Overview card beside Your Event Team on desktop (stacked naturally on smaller screens).
- Removed the duplicate lower Overview stats section.
- Event Overview now summarizes planning progress, vendors, budget, guests/RSVPs, date/location, and checklist.
- Completing an event expires pending quotes, closes open requests, completes confirmed bookings, and notifies vendors with outstanding leads/quotes.
- Canceling an event declines pending quotes, closes open requests, and notifies vendors with outstanding leads/quotes.
- My Events now keeps active/planning events first, then Completed, then Canceled.
- Legacy Inspiration Board URL redirects to Edit Event / Mood Board.

No new Supabase migration is required for this cleanup build.
