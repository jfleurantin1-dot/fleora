-- Qualify objects.name: events also has a name column, so an unqualified
-- name inside the subquery resolves to the event name and rejects uploads.
alter policy "owners upload private invoices" on storage.objects
with check (
 bucket_id = 'event-invoices'
 and (storage.foldername(objects.name))[1] = auth.uid()::text
 and exists (
  select 1 from public.events e
  where e.id::text = (storage.foldername(objects.name))[2]
  and e.client_id = auth.uid()
 )
);
