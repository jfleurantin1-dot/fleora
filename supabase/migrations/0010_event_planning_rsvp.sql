-- Fleora V2.1C: event planning + RSVP groundwork
alter table public.guests add column if not exists phone text;
alter table public.guests add column if not exists plus_one_name text;
alter table public.guests add column if not exists rsvp_token uuid not null default gen_random_uuid();
alter table public.guests add column if not exists rsvp_responded_at timestamptz;
create unique index if not exists guests_rsvp_token_idx on public.guests(rsvp_token);

create or replace function public.get_public_rsvp(p_token uuid)
returns table (
  guest_name text, party_size int, rsvp public.rsvp_status, dietary text,
  plus_one_name text, event_name text, event_date date, event_location text
)
language sql security definer set search_path = public
as $$
  select g.name, g.party_size, g.rsvp, g.dietary, g.plus_one_name,
         e.name, e.event_date, e.location
  from guests g join events e on e.id = g.event_id
  where g.rsvp_token = p_token and e.status <> 'cancelled'
  limit 1;
$$;

grant execute on function public.get_public_rsvp(uuid) to anon, authenticated;

create or replace function public.submit_public_rsvp(
  p_token uuid, p_rsvp public.rsvp_status, p_party_size int,
  p_dietary text default null, p_plus_one_name text default null
)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  update guests g set
    rsvp = p_rsvp,
    party_size = greatest(1, least(coalesce(p_party_size, 1), g.party_size)),
    dietary = nullif(trim(p_dietary), ''),
    plus_one_name = nullif(trim(p_plus_one_name), ''),
    rsvp_responded_at = now()
  from events e
  where g.rsvp_token = p_token and e.id = g.event_id and e.status <> 'cancelled';
  return found;
end;
$$;

grant execute on function public.submit_public_rsvp(uuid, public.rsvp_status, int, text, text) to anon, authenticated;
