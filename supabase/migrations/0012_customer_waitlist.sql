-- Check any manually created customer_waitlist table before applying.
create table if not exists public.customer_waitlist (
 id uuid primary key default gen_random_uuid(),
 first_name text not null,
 email text not null,
 postal_code text not null,
 event_type text,
 event_date date,
 source text not null default 'website',
 status text not null default 'waiting',
 created_at timestamptz not null default now()
);
create unique index if not exists customer_waitlist_email_unique on public.customer_waitlist (lower(email));
alter table public.customer_waitlist enable row level security;
revoke all on public.customer_waitlist from anon, authenticated;
grant select, insert, update, delete on public.customer_waitlist to service_role;
