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
