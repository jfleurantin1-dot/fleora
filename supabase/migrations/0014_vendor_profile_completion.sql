-- Rich storefront details vendors can maintain after claiming their profile.
alter table vendors add column if not exists primary_category text;
alter table vendors add column if not exists event_types text[] not null default '{}';
alter table vendors add column if not exists booking_lead_time text;
alter table vendors add column if not exists availability_notes text;
alter table vendors add column if not exists setup_delivery_notes text;
alter table vendors add column if not exists dietary_accommodations text;
alter table vendors add column if not exists accessibility_notes text;
alter table vendors add column if not exists deposit_policy text;
alter table vendors add column if not exists cancellation_policy text;
alter table vendors add column if not exists travel_fee_policy text;
alter table vendors add column if not exists faqs jsonb not null default '[]'::jsonb;

alter table vendor_claims add column if not exists relationship text;
alter table vendor_claims add column if not exists business_email text;
alter table vendor_claims add column if not exists proof_url text;
