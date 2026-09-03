-- =====================================================================
-- Fleora — 0004: regroup service categories
--
-- The service vocabulary moved from a flat list to grouped subcategories
-- (Dessert / Food & drinks / Photo & entertainment / Decor / Rentals).
-- Three keys were retired: 'decor', 'rentals', 'signage'.
--
-- This remaps any existing rows (demo seed data, plus anything clients or
-- vendors picked before the change) onto the new keys. Safe to run more
-- than once. On a fresh database it simply updates zero rows.
-- =====================================================================

-- ---- vendor_categories -------------------------------------------------
-- A florist's "decor" becomes a flower wall; everyone else's becomes backdrops.
update vendor_categories vc
   set category = 'flower_walls'
  from vendors v
 where v.id = vc.vendor_id
   and vc.category = 'decor'
   and v.business_name = 'Field & Vase Florals'
   and not exists (
     select 1 from vendor_categories x
      where x.vendor_id = vc.vendor_id and x.category = 'flower_walls'
   );

update vendor_categories vc
   set category = 'backdrops'
 where vc.category = 'decor'
   and not exists (
     select 1 from vendor_categories x
      where x.vendor_id = vc.vendor_id and x.category = 'backdrops'
   );

delete from vendor_categories where category = 'decor';

-- 'rentals' fans out to chairs / tables / linens.
insert into vendor_categories (vendor_id, category)
select vc.vendor_id, x.cat
  from vendor_categories vc
  cross join (values ('chairs'), ('tables'), ('linens')) as x(cat)
 where vc.category = 'rentals'
on conflict do nothing;

delete from vendor_categories where category = 'rentals';

delete from vendor_categories where category = 'signage'
   and exists (
     select 1 from vendor_categories x
      where x.vendor_id = vendor_categories.vendor_id and x.category = 'backdrops'
   );
update vendor_categories set category = 'backdrops' where category = 'signage';

-- ---- services --------------------------------------------------------
update services set category = 'backdrops'
 where category = 'decor' and (name ilike '%backdrop%' or name ilike '%sign%');
update services set category = 'flower_walls'
 where category = 'decor' and (name ilike '%tablescape%' or name ilike '%flower wall%');
update services set category = 'balloons'   where category = 'decor';
update services set category = 'tables'     where category = 'rentals' and name ilike '%table%';
update services set category = 'chairs'     where category = 'rentals';
update services set category = 'backdrops'  where category = 'signage';

-- ---- things clients / vendors already picked -------------------------
-- (event_requests has a unique (event_id, category); drop a would-be dupe first)
delete from event_requests er
 where er.category in ('decor', 'rentals', 'signage')
   and exists (
     select 1 from event_requests x
      where x.event_id = er.event_id
        and x.category = case er.category
              when 'decor' then 'balloons'
              when 'rentals' then 'tables'
              when 'signage' then 'backdrops'
            end
   );
update event_requests set category = 'balloons'  where category = 'decor';
update event_requests set category = 'tables'    where category = 'rentals';
update event_requests set category = 'backdrops' where category = 'signage';

update quotes   set category = 'balloons' where category = 'decor';
update quotes   set category = 'tables'   where category = 'rentals';
update quotes   set category = 'backdrops' where category = 'signage';
update bookings set category = 'balloons' where category = 'decor';
update bookings set category = 'tables'   where category = 'rentals';
update bookings set category = 'backdrops' where category = 'signage';
