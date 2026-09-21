-- Let invited guests claim one open potluck item from their private RSVP page.
alter table public.event_potluck_items
  add column if not exists guest_id uuid references public.guests(id) on delete set null;

alter table public.guests
  add column if not exists invitation_shared_at timestamptz;

create index if not exists event_potluck_items_guest_idx
  on public.event_potluck_items(guest_id);

create or replace function public.get_public_potluck_options(p_token uuid)
returns table (
  potluck_item_id uuid,
  item text,
  category text,
  notes text,
  available boolean,
  is_mine boolean
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.item, p.category, p.notes,
         (p.assigned_to is null or p.guest_id = g.id) as available,
         (p.guest_id = g.id) as is_mine
  from public.guests g
  join public.events e on e.id = g.event_id
  join public.event_potluck_items p on p.event_id = e.id
  where g.rsvp_token = p_token
    and e.status <> 'cancelled'
    and exists (
      select 1 from public.event_plan_items plan
      where plan.event_id = e.id and plan.item_key = 'potluck'
    )
  order by p.created_at;
$$;

create or replace function public.claim_public_potluck_item(
  p_token uuid,
  p_item_id uuid default null,
  p_custom_item text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id uuid;
  v_event_id uuid;
  v_guest_name text;
  v_current_guest_id uuid;
  v_current_assignee text;
  v_custom_item text;
begin
  select g.id, g.event_id, coalesce(g.invitation_name, g.name)
    into v_guest_id, v_event_id, v_guest_name
  from public.guests g
  join public.events e on e.id = g.event_id
  where g.rsvp_token = p_token and e.status <> 'cancelled'
  limit 1;

  if v_guest_id is null then return false; end if;

  if not exists (
    select 1 from public.event_plan_items
    where event_id = v_event_id and item_key = 'potluck'
  ) then return false; end if;

  v_custom_item := nullif(left(trim(coalesce(p_custom_item, '')), 160), '');

  if v_custom_item is not null then
    update public.event_potluck_items
      set guest_id = null, assigned_to = null, updated_at = now()
      where event_id = v_event_id and guest_id = v_guest_id;
    insert into public.event_potluck_items(event_id, item, category, assigned_to, guest_id, notes)
      values(v_event_id, v_custom_item, 'other', v_guest_name, v_guest_id, 'Suggested by guest');
    return true;
  end if;

  if p_item_id is null then
    update public.event_potluck_items
      set guest_id = null, assigned_to = null, updated_at = now()
      where event_id = v_event_id and guest_id = v_guest_id;
    return true;
  end if;

  select p.guest_id, p.assigned_to
    into v_current_guest_id, v_current_assignee
  from public.event_potluck_items p
  where p.id = p_item_id and p.event_id = v_event_id
  for update;

  if not found or (v_current_assignee is not null and v_current_guest_id is distinct from v_guest_id) then
    return false;
  end if;

  update public.event_potluck_items
    set guest_id = null, assigned_to = null, updated_at = now()
    where event_id = v_event_id and guest_id = v_guest_id and id <> p_item_id;

  update public.event_potluck_items
    set guest_id = v_guest_id, assigned_to = v_guest_name, updated_at = now()
    where id = p_item_id and event_id = v_event_id;
  return true;
end;
$$;

create or replace function public.get_public_rsvp_extras(p_token uuid)
returns table (
  event_start_time time,
  event_end_time time,
  selected_potluck_item text
)
language sql
security definer
set search_path = public
as $$
  select e.event_start_time, e.event_end_time,
         (select p.item from public.event_potluck_items p where p.guest_id = g.id limit 1)
  from public.guests g
  join public.events e on e.id = g.event_id
  where g.rsvp_token = p_token and e.status <> 'cancelled'
  limit 1;
$$;

grant execute on function public.get_public_potluck_options(uuid) to anon, authenticated;
grant execute on function public.claim_public_potluck_item(uuid, uuid, text) to anon, authenticated;
grant execute on function public.get_public_rsvp_extras(uuid) to anon, authenticated;
