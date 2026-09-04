-- Client onboarding polish: save signup phone + persistent event inspiration uploads.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone, account_type)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'account_type')::account_type, 'client')
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    account_type = excluded.account_type;
  return new;
end;
$$;

create table if not exists public.event_inspiration_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  url text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists event_inspiration_photos_event_idx on public.event_inspiration_photos(event_id, sort);
alter table public.event_inspiration_photos enable row level security;

drop policy if exists "event inspiration: event owner read" on public.event_inspiration_photos;
create policy "event inspiration: event owner read" on public.event_inspiration_photos for select to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid()));

drop policy if exists "event inspiration: event owner insert" on public.event_inspiration_photos;
create policy "event inspiration: event owner insert" on public.event_inspiration_photos for insert to authenticated
with check (exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid()));

drop policy if exists "event inspiration: event owner delete" on public.event_inspiration_photos;
create policy "event inspiration: event owner delete" on public.event_inspiration_photos for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-inspiration', 'event-inspiration', true, 10000000, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "event inspiration storage: public read" on storage.objects;
create policy "event inspiration storage: public read" on storage.objects for select using (bucket_id = 'event-inspiration');

drop policy if exists "event inspiration storage: owner insert" on storage.objects;
create policy "event inspiration storage: owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'event-inspiration' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "event inspiration storage: owner delete" on storage.objects;
create policy "event inspiration storage: owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'event-inspiration' and (storage.foldername(name))[1] = auth.uid()::text);
