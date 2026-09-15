-- Vendors can enter a ZIP code while Fleora keeps a friendly service-location label.
alter table public.vendors
  add column if not exists postal_code text;

alter table public.vendors
  drop constraint if exists vendors_postal_code_format;
alter table public.vendors
  add constraint vendors_postal_code_format
  check (postal_code is null or postal_code ~ '^\d{5}$');

-- A vendor linked to an active inquiry can read the matching planning need and
-- its inspiration photos. Clients retain ownership and write access through the
-- existing policies.
drop policy if exists "event vendor needs: inquiry vendor read" on public.event_vendor_needs;
create policy "event vendor needs: inquiry vendor read"
  on public.event_vendor_needs for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.event_id = event_vendor_needs.event_id
        and c.inquiry_category = event_vendor_needs.category
        and c.vendor_id = public.current_vendor_id()
        and coalesce(c.client_inquiry_status, 'active') <> 'cancelled'
    )
  );

drop policy if exists "event plan item photos: inquiry vendor read" on public.event_plan_item_photos;
create policy "event plan item photos: inquiry vendor read"
  on public.event_plan_item_photos for select
  to authenticated
  using (
    exists (
      select 1
      from public.event_vendor_needs n
      join public.conversations c
        on c.event_id = n.event_id
       and c.inquiry_category = n.category
      where n.plan_item_id = event_plan_item_photos.plan_item_id
        and n.event_id = event_plan_item_photos.event_id
        and c.vendor_id = public.current_vendor_id()
        and coalesce(c.client_inquiry_status, 'active') <> 'cancelled'
    )
  );
