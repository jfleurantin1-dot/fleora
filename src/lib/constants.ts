-- Vendor-first marketplace support: admin-created unclaimed listings + claim requests.

alter table vendors alter column user_id drop not null;
alter table vendors add column if not exists website text;
alter table vendors add column if not exists instagram text;
alter table vendors add column if not exists contact_email text;
alter table vendors add column if not exists contact_phone text;
alter table vendors add column if not exists source text not null default 'self';

create table if not exists vendor_claims (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  claimant_id uuid not null references profiles(id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (vendor_id, claimant_id)
);
create index if not exists vendor_claims_vendor_idx on vendor_claims(vendor_id);
create index if not exists vendor_claims_claimant_idx on vendor_claims(claimant_id);

alter table vendor_claims enable row level security;

create policy "vendors: admin insert"
  on vendors for insert
  to authenticated
  with check (is_admin());

create policy "vendor_categories: admin write"
  on vendor_categories for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "vendor_photos: admin write"
  on vendor_photos for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "services: admin write"
  on services for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "packages: admin write"
  on packages for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "vendor_claims: claimant read own"
  on vendor_claims for select to authenticated
  using (claimant_id = auth.uid() or is_admin());
create policy "vendor_claims: claimant create"
  on vendor_claims for insert to authenticated
  with check (claimant_id = auth.uid());
create policy "vendor_claims: admin update"
  on vendor_claims for update to authenticated
  using (is_admin()) with check (is_admin());
