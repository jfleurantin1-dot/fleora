-- =====================================================================
-- Fleora — 0007: vendor availability
-- Vendors can block dates they are unavailable so clients/admin can use
-- availability in matching and vendors can manage their calendar.
-- Safe to run more than once.
-- =====================================================================

create table if not exists vendor_unavailable_dates (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  unavailable_date date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (vendor_id, unavailable_date)
);

create index if not exists vendor_unavailable_dates_vendor_date_idx
  on vendor_unavailable_dates(vendor_id, unavailable_date);

alter table vendor_unavailable_dates enable row level security;

drop policy if exists "vendor availability: read" on vendor_unavailable_dates;
create policy "vendor availability: read"
  on vendor_unavailable_dates for select
  to authenticated
  using (true);

drop policy if exists "vendor availability: owner write" on vendor_unavailable_dates;
create policy "vendor availability: owner write"
  on vendor_unavailable_dates for all
  to authenticated
  using (vendor_id = current_vendor_id())
  with check (vendor_id = current_vendor_id());

drop policy if exists "vendor availability: admin write" on vendor_unavailable_dates;
create policy "vendor availability: admin write"
  on vendor_unavailable_dates for all
  to authenticated
  using (is_admin())
  with check (is_admin());
