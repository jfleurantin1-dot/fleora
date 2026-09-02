-- =====================================================================
-- Fleora — initial schema
-- Event-planning marketplace: clients create events, get matched with
-- vendors, request quotes, message, and book.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type account_type   as enum ('client', 'vendor', 'admin');
create type event_status    as enum ('planning', 'active', 'completed', 'cancelled');
create type vendor_status   as enum ('pending', 'approved', 'suspended');
create type request_status  as enum ('open', 'quoted', 'booked', 'closed');
create type quote_status     as enum ('sent', 'accepted', 'declined', 'expired');
create type booking_status   as enum ('pending_deposit', 'confirmed', 'completed', 'cancelled');
create type rsvp_status      as enum ('pending', 'yes', 'no');

-- ---------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  first_name    text,
  last_name     text,
  phone         text,
  account_type  account_type not null default 'client',
  profile_photo text,
  created_at    timestamptz not null default now()
);

-- Auto-provision a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, account_type)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce((new.raw_user_meta_data ->> 'account_type')::account_type, 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
create table events (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references profiles(id) on delete cascade,
  name          text not null,
  event_type    text not null,
  event_date    date,
  location      text,
  latitude      double precision,
  longitude     double precision,
  guest_count   int,
  budget        numeric(10,2),
  style         text,
  color_palette text,
  status        event_status not null default 'planning',
  created_at    timestamptz not null default now()
);
create index events_client_idx on events(client_id);

-- ---------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------
create table vendors (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references profiles(id) on delete cascade,
  business_name       text not null,
  description         text,
  location            text,
  latitude            double precision,
  longitude           double precision,
  service_radius_miles int not null default 25,
  rating              numeric(2,1) not null default 0,
  review_count        int not null default 0,
  verified            boolean not null default false,
  response_rate       int not null default 0,
  status              vendor_status not null default 'pending',
  created_at          timestamptz not null default now()
);

create table vendor_categories (
  vendor_id uuid not null references vendors(id) on delete cascade,
  category  text not null,
  primary key (vendor_id, category)
);

create table vendor_photos (
  id        uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  url       text not null,
  sort      int not null default 0
);

create table services (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references vendors(id) on delete cascade,
  category       text not null,
  name           text not null,
  description    text,
  starting_price numeric(10,2)
);
create index services_vendor_idx on services(vendor_id);
create index services_category_idx on services(category);

create table packages (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references vendors(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10,2)
);

-- ---------------------------------------------------------------------
-- event_requests — a client wants a category filled for an event
-- ---------------------------------------------------------------------
create table event_requests (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  category   text not null,
  notes      text,
  status     request_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (event_id, category)
);

-- ---------------------------------------------------------------------
-- conversations + messages
-- one thread per (event, vendor)
-- ---------------------------------------------------------------------
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  client_id  uuid not null references profiles(id) on delete cascade,
  vendor_id  uuid not null references vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, vendor_id)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  attachment_url  text,
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on messages(conversation_id, created_at);

-- ---------------------------------------------------------------------
-- quotes + line items
-- ---------------------------------------------------------------------
create table quotes (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  vendor_id  uuid not null references vendors(id) on delete cascade,
  request_id uuid references event_requests(id) on delete set null,
  category   text not null,
  status     quote_status not null default 'sent',
  subtotal   numeric(10,2) not null default 0,
  deposit    numeric(10,2) not null default 0,
  total      numeric(10,2) not null default 0,
  notes      text,
  expires_at date,
  created_at timestamptz not null default now()
);
create index quotes_event_idx on quotes(event_id);
create index quotes_vendor_idx on quotes(vendor_id);

create table quote_items (
  id       uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  label    text not null,
  amount   numeric(10,2) not null default 0,
  sort     int not null default 0
);

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
create table bookings (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  vendor_id    uuid not null references vendors(id) on delete cascade,
  quote_id     uuid not null unique references quotes(id) on delete cascade,
  category     text not null,
  status       booking_status not null default 'pending_deposit',
  total        numeric(10,2) not null default 0,
  deposit_paid numeric(10,2) not null default 0,
  balance      numeric(10,2) not null default 0,
  created_at   timestamptz not null default now()
);
create index bookings_event_idx on bookings(event_id);
create index bookings_vendor_idx on bookings(vendor_id);

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references bookings(id) on delete cascade,
  client_id     uuid not null references profiles(id) on delete cascade,
  vendor_id     uuid not null references vendors(id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  communication int check (communication between 1 and 5),
  quality       int check (quality between 1 and 5),
  value         int check (value between 1 and 5),
  comment       text,
  verified      boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Keep vendors.rating / review_count in sync.
create or replace function public.refresh_vendor_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  update vendors v set
    rating = coalesce((select round(avg(r.rating)::numeric, 1) from reviews r where r.vendor_id = v_id), 0),
    review_count = (select count(*) from reviews r where r.vendor_id = v_id)
  where v.id = v_id;
  return null;
end;
$$;

create trigger reviews_rating_sync
  after insert or update or delete on reviews
  for each row execute function public.refresh_vendor_rating();

-- ---------------------------------------------------------------------
-- Planning tools: guest list + checklist (Phase 2 preview)
-- ---------------------------------------------------------------------
create table guests (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null,
  email      text,
  party_size int not null default 1,
  rsvp       rsvp_status not null default 'pending',
  dietary    text,
  created_at timestamptz not null default now()
);
create index guests_event_idx on guests(event_id);

create table checklist_items (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  title      text not null,
  weeks_before int,
  done       boolean not null default false,
  sort       int not null default 0
);
create index checklist_event_idx on checklist_items(event_id);
