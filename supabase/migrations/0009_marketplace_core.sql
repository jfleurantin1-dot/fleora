-- =====================================================================
-- Fleora — 0009: marketplace core
-- Favorites, message attachments, notifications, availability-aware match.
-- Safe to run more than once.
-- =====================================================================

create table if not exists vendor_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vendor_id)
);
alter table vendor_favorites enable row level security;
drop policy if exists "favorites: owner read" on vendor_favorites;
create policy "favorites: owner read" on vendor_favorites for select to authenticated using (user_id = auth.uid());
drop policy if exists "favorites: owner write" on vendor_favorites;
create policy "favorites: owner write" on vendor_favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on notifications(user_id, created_at desc);
alter table notifications enable row level security;
drop policy if exists "notifications: owner read" on notifications;
create policy "notifications: owner read" on notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications: owner update" on notifications;
create policy "notifications: owner update" on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Message media bucket. Paths are user-id/conversation-id/random-file.ext.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-attachments','message-attachments',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true, file_size_limit=10485760,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "message attachments: authenticated upload" on storage.objects;
create policy "message attachments: authenticated upload" on storage.objects for insert to authenticated
with check (bucket_id='message-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "message attachments: owner delete" on storage.objects;
create policy "message attachments: owner delete" on storage.objects for delete to authenticated
using (bucket_id='message-attachments' and (storage.foldername(name))[1]=auth.uid()::text);

-- Notifications generated inside Postgres so web + mobile clients stay in sync.
create or replace function public.notify_new_message() returns trigger language plpgsql security definer set search_path=public as $$
declare c conversations%rowtype; recipient uuid; sender_name text;
begin
  select * into c from conversations where id=new.conversation_id;
  if not found then return new; end if;
  if new.sender_id=c.client_id then
    select user_id into recipient from vendors where id=c.vendor_id;
  else recipient:=c.client_id; end if;
  if recipient is not null and recipient<>new.sender_id then
    insert into notifications(user_id,kind,title,body,href)
    values(recipient,'message','New message on Fleora',case when new.attachment_url is not null then 'You received a new message with a photo.' else left(new.body,140) end,'/messages/'||new.conversation_id);
  end if;
  return new;
end $$;
drop trigger if exists messages_notify_insert on messages;
create trigger messages_notify_insert after insert on messages for each row execute function public.notify_new_message();

create or replace function public.notify_quote_change() returns trigger language plpgsql security definer set search_path=public as $$
declare client uuid; vendor_user uuid; event_name text;
begin
  select client_id,name into client,event_name from events where id=new.event_id;
  select user_id into vendor_user from vendors where id=new.vendor_id;
  if tg_op='INSERT' then
    if client is not null then insert into notifications(user_id,kind,title,body,href) values(client,'quote','New quote ready',coalesce(event_name,'Your event')||' has a new vendor quote.','/quotes/'||new.id); end if;
  elsif old.status is distinct from new.status then
    if new.status in ('accepted','declined') and vendor_user is not null then insert into notifications(user_id,kind,title,body,href) values(vendor_user,'quote','Quote '||new.status,coalesce(event_name,'An event')||' quote was '||new.status||'.','/messages'); end if;
  end if;
  return new;
end $$;
drop trigger if exists quotes_notify_change on quotes;
create trigger quotes_notify_change after insert or update of status on quotes for each row execute function public.notify_quote_change();

create or replace function public.notify_new_lead() returns trigger language plpgsql security definer set search_path=public as $$
declare vendor_user uuid; event_name text;
begin
  select user_id into vendor_user from vendors where id=new.vendor_id;
  select name into event_name from events where id=new.event_id;
  if vendor_user is not null then insert into notifications(user_id,kind,title,body,href) values(vendor_user,'lead','New lead on Fleora',coalesce(event_name,'A client')||' wants to connect.','/vendor/leads'); end if;
  return new;
end $$;
drop trigger if exists conversations_notify_insert on conversations;
create trigger conversations_notify_insert after insert on conversations for each row execute function public.notify_new_lead();

-- Matching now respects manually blocked vendor dates as well as bookings.
create or replace function public.match_vendors(p_event_id uuid, p_category text)
returns table (
  vendor_id uuid,business_name text,description text,location text,rating numeric,review_count int,verified boolean,
  starting_price numeric,distance_miles double precision,hero_photo text,match_score int,availability_score int,
  location_score int,budget_score int,style_score int,review_score int
)
language plpgsql stable security definer set search_path=public as $$
declare ev events%rowtype;
begin
  select * into ev from events where id=p_event_id; if not found then return; end if;
  return query
  with base as (
    select v.id,v.business_name,v.description,v.location,v.rating,v.review_count,v.verified,v.service_radius_miles,v.latitude,v.longitude,
      (select min(s.starting_price) from services s where s.vendor_id=v.id and s.category=p_category) cat_price,
      (select vp.url from vendor_photos vp where vp.vendor_id=v.id order by vp.sort limit 1) hero_photo
    from vendors v join vendor_categories vc on vc.vendor_id=v.id and vc.category=p_category where v.status='approved'
  ), scored as (
    select b.*,case when ev.latitude is null or b.latitude is null then null else distance_miles(ev.latitude,ev.longitude,b.latitude,b.longitude) end dist,
      case when ev.event_date is not null and (
        exists(select 1 from bookings bk join events e2 on e2.id=bk.event_id where bk.vendor_id=b.id and e2.event_date=ev.event_date and bk.status<>'cancelled')
        or exists(select 1 from vendor_unavailable_dates vu where vu.vendor_id=b.id and vu.unavailable_date=ev.event_date)
      ) then 0 else 100 end avail_score
    from base b
  ), components as (
    select s.*,
      case when s.dist is null then 70 when s.dist<=s.service_radius_miles then greatest(0,round(100-(s.dist/nullif(s.service_radius_miles,0))*40))::int else greatest(0,round(60-(s.dist-s.service_radius_miles)*3))::int end loc_score,
      case when ev.budget is null or s.cat_price is null then 70 when s.cat_price<=ev.budget*.30 then 100 when s.cat_price<=ev.budget*.50 then 82 when s.cat_price<=ev.budget then 58 else 28 end bud_score,
      case when ev.style is null then 80 when s.description is not null and s.description ~* ('('||replace(trim(ev.style),' ','|')||')') then 96 else 82 end sty_score,
      round(coalesce(s.rating,0)/5.0*100)::int rev_score
    from scored s
  )
  select c.id,c.business_name,c.description,c.location,c.rating,c.review_count,c.verified,c.cat_price,c.dist,c.hero_photo,
    round(c.avail_score*.30+c.loc_score*.25+c.bud_score*.20+c.sty_score*.15+c.rev_score*.10)::int,
    c.avail_score,c.loc_score,c.bud_score,c.sty_score,c.rev_score
  from components c order by match_score desc,c.rating desc nulls last,c.review_count desc;
end $$;
