# Fleora V2.1C — Event Planning

- Removed redundant “Shape your event vision” dashboard section.
- Mood Board is now the single inspiration concept: upload at event creation and add/remove photos from Edit Event.
- Added Edit Event page for details + Mood Board.
- Added event lifecycle controls: Complete, Cancel, Delete.
- Cancel confirmation declines pending quotes, closes open leads and creates vendor in-app notifications.
- Expanded Guest List into RSVP management with invited/going/declined/awaiting counts, email/phone, and private RSVP links.
- Added public mobile RSVP page (no Fleora account required) with party count, plus-one and dietary notes.
- Expanded checklist so clients can add/remove their own tasks in addition to seeded tasks.

## Setup
Run `supabase/migrations/0010_event_planning_rsvp.sql` in a NEW Supabase SQL query before deploying `src`.

## Next RSVP phase
Branded email delivery and AI/mood-board-generated invitation artwork are intentionally not faked here. This build creates the real guest + RSVP infrastructure those features will use.
