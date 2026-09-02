-- ============================================================
-- Fleora — full schema (migrations 0001 + 0002 + 0003)
-- Paste this whole file into the Supabase SQL Editor and Run.
-- ============================================================

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


-- =====================================================================
-- Fleora — Row Level Security
-- NOTE: These policies are a sensible MVP baseline. Review carefully
-- (especially profile visibility) before a production launch.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.account_type = 'admin'
  );
$$;

create or replace function public.current_vendor_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from vendors where user_id = auth.uid();
$$;

create or replace function public.owns_event(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from events e where e.id = p_event_id and e.client_id = auth.uid()
  );
$$;

-- Vendor "sees" an event only once a conversation or quote links them to it.
create or replace function public.vendor_linked_to_event(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from conversations c
    where c.event_id = p_event_id and c.vendor_id = public.current_vendor_id()
  ) or exists (
    select 1 from quotes q
    where q.event_id = p_event_id and q.vendor_id = public.current_vendor_id()
  );
$$;

-- ---------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------
alter table profiles          enable row level security;
alter table events            enable row level security;
alter table vendors           enable row level security;
alter table vendor_categories enable row level security;
alter table vendor_photos     enable row level security;
alter table services          enable row level security;
alter table packages          enable row level security;
alter table event_requests    enable row level security;
alter table conversations     enable row level security;
alter table messages          enable row level security;
alter table quotes            enable row level security;
alter table quote_items       enable row level security;
alter table bookings          enable row level security;
alter table reviews           enable row level security;
alter table guests            enable row level security;
alter table checklist_items   enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles: read all (authenticated)"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles: update own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
create policy "events: client full access"
  on events for all
  to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "events: vendor read when linked"
  on events for select
  to authenticated
  using (vendor_linked_to_event(id));

create policy "events: admin read"
  on events for select
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------
create policy "vendors: public read approved"
  on vendors for select
  to authenticated
  using (status = 'approved' or user_id = auth.uid() or is_admin());

create policy "vendors: owner insert"
  on vendors for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "vendors: owner update"
  on vendors for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "vendors: admin update"
  on vendors for update
  to authenticated
  using (is_admin());

-- Child tables of vendors: readable with the vendor, writable by owner.
create policy "vendor_categories: read"
  on vendor_categories for select to authenticated using (true);
create policy "vendor_categories: owner write"
  on vendor_categories for all to authenticated
  using (vendor_id = current_vendor_id())
  with check (vendor_id = current_vendor_id());

create policy "vendor_photos: read"
  on vendor_photos for select to authenticated using (true);
create policy "vendor_photos: owner write"
  on vendor_photos for all to authenticated
  using (vendor_id = current_vendor_id())
  with check (vendor_id = current_vendor_id());

create policy "services: read"
  on services for select to authenticated using (true);
create policy "services: owner write"
  on services for all to authenticated
  using (vendor_id = current_vendor_id())
  with check (vendor_id = current_vendor_id());

create policy "packages: read"
  on packages for select to authenticated using (true);
create policy "packages: owner write"
  on packages for all to authenticated
  using (vendor_id = current_vendor_id())
  with check (vendor_id = current_vendor_id());

-- ---------------------------------------------------------------------
-- event_requests
-- ---------------------------------------------------------------------
create policy "event_requests: client manages own"
  on event_requests for all
  to authenticated
  using (owns_event(event_id))
  with check (owns_event(event_id));

create policy "event_requests: vendor reads open"
  on event_requests for select
  to authenticated
  using (status = 'open' and current_vendor_id() is not null);

-- A vendor may flip an event_request to 'quoted' for an event they're linked to.
create policy "event_requests: vendor marks quoted"
  on event_requests for update
  to authenticated
  using (current_vendor_id() is not null and vendor_linked_to_event(event_id))
  with check (current_vendor_id() is not null and vendor_linked_to_event(event_id));

create policy "event_requests: admin read"
  on event_requests for select
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------
create policy "conversations: participants read"
  on conversations for select
  to authenticated
  using (client_id = auth.uid() or vendor_id = current_vendor_id() or is_admin());

create policy "conversations: client creates"
  on conversations for insert
  to authenticated
  with check (client_id = auth.uid() and owns_event(event_id));

-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
create policy "messages: participants read"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.client_id = auth.uid() or c.vendor_id = current_vendor_id() or is_admin())
    )
  );

create policy "messages: participants send"
  on messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.client_id = auth.uid() or c.vendor_id = current_vendor_id())
    )
  );

-- ---------------------------------------------------------------------
-- quotes + quote_items
-- ---------------------------------------------------------------------
create policy "quotes: client reads own event"
  on quotes for select
  to authenticated
  using (owns_event(event_id) or vendor_id = current_vendor_id() or is_admin());

create policy "quotes: vendor creates"
  on quotes for insert
  to authenticated
  with check (vendor_id = current_vendor_id());

create policy "quotes: vendor updates own"
  on quotes for update
  to authenticated
  using (vendor_id = current_vendor_id())
  with check (vendor_id = current_vendor_id());

create policy "quotes: client updates status"
  on quotes for update
  to authenticated
  using (owns_event(event_id))
  with check (owns_event(event_id));

create policy "quote_items: read with quote"
  on quote_items for select
  to authenticated
  using (
    exists (
      select 1 from quotes q
      where q.id = quote_id
        and (owns_event(q.event_id) or q.vendor_id = current_vendor_id() or is_admin())
    )
  );

create policy "quote_items: vendor writes own"
  on quote_items for all
  to authenticated
  using (exists (select 1 from quotes q where q.id = quote_id and q.vendor_id = current_vendor_id()))
  with check (exists (select 1 from quotes q where q.id = quote_id and q.vendor_id = current_vendor_id()));

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
create policy "bookings: participants read"
  on bookings for select
  to authenticated
  using (owns_event(event_id) or vendor_id = current_vendor_id() or is_admin());

create policy "bookings: client creates"
  on bookings for insert
  to authenticated
  with check (owns_event(event_id));

create policy "bookings: participants update"
  on bookings for update
  to authenticated
  using (owns_event(event_id) or vendor_id = current_vendor_id())
  with check (owns_event(event_id) or vendor_id = current_vendor_id());

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create policy "reviews: public read"
  on reviews for select to authenticated using (true);

create policy "reviews: client writes own"
  on reviews for all
  to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ---------------------------------------------------------------------
-- guests + checklist_items  (client-owned)
-- ---------------------------------------------------------------------
create policy "guests: client manages"
  on guests for all
  to authenticated
  using (owns_event(event_id))
  with check (owns_event(event_id));

create policy "checklist_items: client manages"
  on checklist_items for all
  to authenticated
  using (owns_event(event_id))
  with check (owns_event(event_id));


-- =====================================================================
-- Fleora — vendor matching + planning helpers
-- =====================================================================

-- Great-circle distance in miles (Haversine).
create or replace function public.distance_miles(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
)
returns double precision
language sql immutable
as $$
  select 3959 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
    * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- ---------------------------------------------------------------------
-- match_vendors(event, category)
--
-- Returns approved vendors that cover `category`, each with a 0-100
-- match score. Weights:
--   availability 30 | location 25 | budget 20 | style 15 | reviews 10
-- The TS mirror in src/lib/matching.ts must stay in sync with this.
-- ---------------------------------------------------------------------
-- security definer so the availability check can see all vendors' bookings
-- regardless of which client calls it. Only approved vendors + safe columns
-- are returned.
create or replace function public.match_vendors(p_event_id uuid, p_category text)
returns table (
  vendor_id      uuid,
  business_name  text,
  description    text,
  location       text,
  rating         numeric,
  review_count   int,
  verified       boolean,
  starting_price numeric,
  distance_miles double precision,
  hero_photo     text,
  match_score    int,
  availability_score int,
  location_score int,
  budget_score   int,
  style_score    int,
  review_score   int
)
language plpgsql stable security definer set search_path = public
as $$
declare
  ev events%rowtype;
begin
  select * into ev from events where id = p_event_id;
  if not found then
    return;
  end if;

  return query
  with base as (
    select
      v.id,
      v.business_name,
      v.description,
      v.location,
      v.rating,
      v.review_count,
      v.verified,
      v.service_radius_miles,
      v.latitude,
      v.longitude,
      (select min(s.starting_price)
         from services s
        where s.vendor_id = v.id and s.category = p_category) as cat_price,
      (select vp.url from vendor_photos vp
        where vp.vendor_id = v.id order by vp.sort limit 1)   as hero_photo
    from vendors v
    join vendor_categories vc
      on vc.vendor_id = v.id and vc.category = p_category
    where v.status = 'approved'
  ),
  scored as (
    select
      b.*,
      case
        when ev.latitude is null or b.latitude is null then null
        else distance_miles(ev.latitude, ev.longitude, b.latitude, b.longitude)
      end as dist,
      -- availability: penalise a same-day booking that isn't cancelled
      case when exists (
        select 1 from bookings bk
        join events e2 on e2.id = bk.event_id
        where bk.vendor_id = b.id
          and e2.event_date = ev.event_date
          and bk.status <> 'cancelled'
      ) then 40 else 100 end as avail_score
    from base b
  ),
  components as (
    select
      s.*,
      case
        when s.dist is null then 70
        when s.dist <= s.service_radius_miles
          then greatest(0, round(100 - (s.dist / nullif(s.service_radius_miles, 0)) * 40))::int
        else greatest(0, round(60 - (s.dist - s.service_radius_miles) * 3))::int
      end as loc_score,
      case
        when ev.budget is null or s.cat_price is null then 70
        when s.cat_price <= ev.budget * 0.30 then 100
        when s.cat_price <= ev.budget * 0.50 then 82
        when s.cat_price <= ev.budget         then 58
        else 28
      end as bud_score,
      case
        when ev.style is null then 80
        when s.description is not null
             and s.description ~* ('(' || replace(trim(ev.style), ' ', '|') || ')') then 96
        else 82
      end as sty_score,
      round(coalesce(s.rating, 0) / 5.0 * 100)::int as rev_score
    from scored s
  )
  select
    c.id,
    c.business_name,
    c.description,
    c.location,
    c.rating,
    c.review_count,
    c.verified,
    c.cat_price,
    c.dist,
    c.hero_photo,
    round(
        c.avail_score * 0.30
      + c.loc_score   * 0.25
      + c.bud_score   * 0.20
      + c.sty_score   * 0.15
      + c.rev_score   * 0.10
    )::int as match_score,
    c.avail_score,
    c.loc_score,
    c.bud_score,
    c.sty_score,
    c.rev_score
  from components c
  order by match_score desc, c.rating desc nulls last, c.review_count desc;
end;
$$;

-- ---------------------------------------------------------------------
-- seed_event_checklist(event) — drop a starter checklist onto an event
-- ---------------------------------------------------------------------
create or replace function public.seed_event_checklist(p_event_id uuid)
returns void
language plpgsql
as $$
begin
  if exists (select 1 from checklist_items where event_id = p_event_id) then
    return;
  end if;

  insert into checklist_items (event_id, title, weeks_before, sort) values
    (p_event_id, 'Lock in your venue',                  12, 1),
    (p_event_id, 'Book photographer & videographer',    12, 2),
    (p_event_id, 'Book caterer',                        10, 3),
    (p_event_id, 'Book decor / balloons',                9, 4),
    (p_event_id, 'Reserve tables, chairs & linens',      8, 5),
    (p_event_id, 'Send invitations',                     8, 6),
    (p_event_id, 'Order the cake',                        6, 7),
    (p_event_id, 'Book DJ or entertainment',              6, 8),
    (p_event_id, 'Confirm guest count',                   3, 9),
    (p_event_id, 'Finalize menu & dietary needs',         3, 10),
    (p_event_id, 'Confirm delivery & setup times',        1, 11),
    (p_event_id, 'Send final payments',                   1, 12);
end;
$$;
