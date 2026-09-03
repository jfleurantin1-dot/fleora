-- =====================================================================
-- Fleora — 0005: vendor photo uploads
--
-- Creates a public Storage bucket for vendor portfolio images and the
-- policies that let a signed-in vendor manage files inside a folder
-- named after their own user id. Anyone can read (public bucket).
--
-- Run in the Supabase SQL Editor. Safe to run more than once.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-photos', 'vendor-photos', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vendor photos are publicly readable" on storage.objects;
create policy "vendor photos are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'vendor-photos');

drop policy if exists "vendors upload their own photos" on storage.objects;
create policy "vendors upload their own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vendor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vendors update their own photos" on storage.objects;
create policy "vendors update their own photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vendor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vendors delete their own photos" on storage.objects;
create policy "vendors delete their own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vendor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
