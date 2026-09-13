-- Product links belong to the existing event plan item and inherit its RLS policies.
alter table public.event_plan_items
  add column if not exists diy_products jsonb not null default '[]'::jsonb;
alter table public.event_plan_items
  add constraint event_plan_items_diy_products_array
  check (jsonb_typeof(diy_products) = 'array' and jsonb_array_length(diy_products) <= 20);
