-- Fleora Pay 1A — Stripe Connect foundation
-- Run once in a NEW Supabase SQL query after 0010_event_planning_rsvp.sql.

alter table public.vendors
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_status text not null default 'not_started',
  add column if not exists stripe_details_submitted boolean not null default false,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_transfers_status text,
  add column if not exists stripe_last_synced_at timestamptz;

do $$ begin
  alter table public.vendors add constraint vendors_stripe_onboarding_status_check
    check (stripe_onboarding_status in ('not_started','in_progress','ready','restricted'));
exception when duplicate_object then null; end $$;

create unique index if not exists vendors_stripe_account_id_unique
  on public.vendors(stripe_account_id)
  where stripe_account_id is not null;

-- One-row configuration table. Keep the fee configurable instead of hard-coding it.
create table if not exists public.payment_settings (
  id smallint primary key default 1 check (id = 1),
  platform_fee_bps integer not null default 800 check (platform_fee_bps between 0 and 5000),
  currency text not null default 'usd',
  deposits_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.payment_settings(id, platform_fee_bps, currency, deposits_enabled)
values (1, 800, 'usd', true)
on conflict (id) do nothing;

alter table public.payment_settings enable row level security;
drop policy if exists "payment settings: authenticated read" on public.payment_settings;
create policy "payment settings: authenticated read"
  on public.payment_settings for select to authenticated
  using (true);

-- Payment ledger foundation. Pay 1B will create Checkout Sessions and populate this table.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  payment_type text not null check (payment_type in ('deposit','balance','full')),
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled','refunded','partially_refunded')),
  amount numeric(10,2) not null check (amount >= 0),
  platform_fee numeric(10,2) not null default 0 check (platform_fee >= 0),
  vendor_net numeric(10,2) not null default 0 check (vendor_net >= 0),
  currency text not null default 'usd',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  paid_at timestamptz,
  refunded_amount numeric(10,2) not null default 0 check (refunded_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_event_idx on public.payments(event_id, created_at desc);
create index if not exists payments_vendor_idx on public.payments(vendor_id, created_at desc);
create index if not exists payments_client_idx on public.payments(client_id, created_at desc);
create unique index if not exists payments_checkout_session_unique
  on public.payments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create unique index if not exists payments_payment_intent_unique
  on public.payments(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

alter table public.payments enable row level security;
drop policy if exists "payments: participants read" on public.payments;
create policy "payments: participants read"
  on public.payments for select to authenticated
  using (
    client_id = auth.uid()
    or vendor_id = public.current_vendor_id()
    or public.is_admin()
  );

-- Deliberately no client-side INSERT/UPDATE policy. Fleora's server/webhooks own money-state writes.
