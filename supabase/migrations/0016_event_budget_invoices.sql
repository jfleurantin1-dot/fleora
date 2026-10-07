-- Event budget expenses and private invoice attachments.
create table public.event_budget_expenses (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 description text not null check (length(trim(description)) between 1 and 200),
 vendor_name text not null default '',
 category text not null default 'Other',
 amount numeric(10,2) not null check (amount >= 0),
 paid_amount numeric(10,2) not null default 0 check (paid_amount >= 0 and paid_amount <= amount),
 created_at timestamptz not null default now()
);
create index on public.event_budget_expenses(event_id);
alter table public.event_budget_expenses enable row level security;
create policy "owners manage budget expenses" on public.event_budget_expenses
 for all to authenticated
 using (exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid()))
 with check (exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid()));

create table public.event_budget_invoices (
 id uuid primary key,
 event_id uuid not null references public.events(id) on delete cascade,
 expense_id uuid references public.event_budget_expenses(id) on delete cascade,
 booking_id uuid references public.bookings(id) on delete cascade,
 storage_path text not null unique,
 filename text not null,
 created_at timestamptz not null default now(),
 check ((expense_id is not null)::integer + (booking_id is not null)::integer = 1)
);
create index on public.event_budget_invoices(event_id);
alter table public.event_budget_invoices enable row level security;
create policy "owners read budget invoices" on public.event_budget_invoices
 for select to authenticated using (exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid()));
create policy "owners insert budget invoices" on public.event_budget_invoices
 for insert to authenticated with check (
 exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid())
 and storage_path = auth.uid()::text || '/' || event_id::text || '/' || id::text
 and (expense_id is null or exists (select 1 from public.event_budget_expenses x where x.id = expense_id and x.event_id = event_budget_invoices.event_id))
 and (booking_id is null or exists (select 1 from public.bookings b where b.id = booking_id and b.event_id = event_budget_invoices.event_id))
 );
create policy "owners delete budget invoices" on public.event_budget_invoices
 for delete to authenticated using (exists (select 1 from public.events e where e.id = event_id and e.client_id = auth.uid()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('event-invoices','event-invoices',false,3145728,array['application/pdf','image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "owners upload private invoices" on storage.objects for insert to authenticated
 with check (bucket_id='event-invoices' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.events e where e.id::text=(storage.foldername(name))[2] and e.client_id=auth.uid()));
create policy "owners read private invoices" on storage.objects for select to authenticated
 using (bucket_id='event-invoices' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "owners delete private invoices" on storage.objects for delete to authenticated
 using (bucket_id='event-invoices' and (storage.foldername(name))[1]=auth.uid()::text);
