-- Keep one budget entry per planning choice, including before a chapter is saved.
alter table public.event_budget_expenses add column source_plan_key text;
alter table public.event_budget_expenses add constraint event_budget_expenses_source_plan_key_check
 check (source_plan_key is null or source_plan_key ~ '^(decor|food_drinks|services|entertainment|venue_logistics):[a-z0-9_]{1,100}$');
create unique index event_budget_expenses_event_plan_unique
 on public.event_budget_expenses(event_id, source_plan_key);
