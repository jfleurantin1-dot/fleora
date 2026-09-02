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
