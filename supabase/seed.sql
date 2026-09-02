-- =====================================================================
-- Fleora — seed data (local dev)
-- Loaded by `supabase db reset`.
--
-- All demo accounts use the password:  fleora123
--   Client  : jerrica@example.com
--   Vendors : hello@luxeballoons.com, orders@sugarplumbakes.com, ... (see below)
--   Admin   : admin@fleora.app
-- =====================================================================

-- ---------------------------------------------------------------------
-- Auth users  (the on_auth_user_created trigger creates matching profiles)
-- ---------------------------------------------------------------------
create or replace function pg_temp.mk_user(
  p_id uuid, p_email text, p_first text, p_last text, p_type text
) returns void language plpgsql as $$
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) values (
    p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    p_email, crypt('fleora123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('first_name', p_first, 'last_name', p_last, 'account_type', p_type),
    now(), now(), '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), p_id::text, p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email', now(), now(), now()
  );
end;
$$;

select pg_temp.mk_user('11111111-1111-1111-1111-111111111111', 'jerrica@example.com',      'Jerrica', 'F.',        'client');
select pg_temp.mk_user('22222222-2222-2222-2222-222222222222', 'admin@fleora.app',          'Fleora',  'Admin',     'admin');

select pg_temp.mk_user('a0000001-0000-0000-0000-000000000001', 'hello@luxeballoons.com',    'Nadia',   'Cole',      'vendor');
select pg_temp.mk_user('a0000002-0000-0000-0000-000000000002', 'orders@sugarplumbakes.com', 'Priya',   'Raman',     'vendor');
select pg_temp.mk_user('a0000003-0000-0000-0000-000000000003', 'events@harborcatering.com', 'Marcus',  'Bell',      'vendor');
select pg_temp.mk_user('a0000004-0000-0000-0000-000000000004', 'rent@baystaterentals.com',  'Dominic', 'Ferreira',  'vendor');
select pg_temp.mk_user('a0000005-0000-0000-0000-000000000005', 'studio@lumenphoto.com',     'Alina',   'Novak',     'vendor');
select pg_temp.mk_user('a0000006-0000-0000-0000-000000000006', 'book@nightowldj.com',       'Terrence','Wright',    'vendor');
select pg_temp.mk_user('a0000007-0000-0000-0000-000000000007', 'hello@fieldandvasefl.com',  'Sofia',   'Moreno',    'vendor');
select pg_temp.mk_user('a0000008-0000-0000-0000-000000000008', 'cheers@tidewaterbar.com',   'Reggie',  'Adams',     'vendor');
select pg_temp.mk_user('a0000009-0000-0000-0000-000000000009', 'hi@petalpressco.com',       'Grace',   'Kim',       'vendor');  -- pending approval

-- ---------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------
insert into vendors (id, user_id, business_name, description, location, latitude, longitude, service_radius_miles, verified, response_rate, status) values
  ('b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','Luxe Balloons Co.',      'Luxury organic balloon installations, backdrops and grazing-table styling for modern, elegant celebrations. Pink, gold and neutral palettes are our specialty.', 'Quincy, MA',   42.2529, -71.0023, 35, true, 94, 'approved'),
  ('b0000002-0000-0000-0000-000000000002','a0000002-0000-0000-0000-000000000002','Sugar Plum Bakes',       'Small-batch custom cakes and dessert tables. Buttercream, fresh florals and hand-painted detail work.',                                                             'Brockton, MA', 42.0834, -71.0184, 30, true, 88, 'approved'),
  ('b0000003-0000-0000-0000-000000000003','a0000003-0000-0000-0000-000000000003','Harbor Catering',        'Full-service catering for 20 to 300 guests. Seasonal New England menus, plated or family-style, staffing included.',                                                 'Boston, MA',   42.3601, -71.0589, 40, true, 91, 'approved'),
  ('b0000004-0000-0000-0000-000000000004','a0000004-0000-0000-0000-000000000004','Bay State Rentals',      'Tables, chairs, linens, china, glassware, lounge furniture and tenting. Delivery, setup and teardown across Greater Boston.',                                        'Newton, MA',   42.3370, -71.2092, 45, true, 82, 'approved'),
  ('b0000005-0000-0000-0000-000000000005','a0000005-0000-0000-0000-000000000005','Lumen Photography',      'Editorial event photography with a warm, candid style. Same-week sneak peeks, full galleries in two weeks.',                                                          'Cambridge, MA',42.3736, -71.1097, 50, true, 97, 'approved'),
  ('b0000006-0000-0000-0000-000000000006','a0000006-0000-0000-0000-000000000006','Night Owl DJ',           'Open-format DJs and MCs for birthdays, weddings and corporate events. Sound, lighting and dance-floor packages.',                                                    'Boston, MA',   42.3601, -71.0589, 45, false, 79, 'approved'),
  ('b0000007-0000-0000-0000-000000000007','a0000007-0000-0000-0000-000000000007','Field & Vase Florals',   'Garden-style florals, arbors and installations. Locally grown stems whenever the season allows.',                                                                   'Framingham, MA',42.2793, -71.4162, 40, true, 90, 'approved'),
  ('b0000008-0000-0000-0000-000000000008','a0000008-0000-0000-0000-000000000008','Tidewater Bar Co.',      'Licensed and insured mobile bartending. Signature cocktails, mocktails and a styled bar cart.',                                                                     'Quincy, MA',   42.2529, -71.0023, 35, true, 85, 'approved'),
  ('b0000009-0000-0000-0000-000000000009','a0000009-0000-0000-0000-000000000009','Petal Press Co.',        'Hand-lettered signage, invitations and day-of paper goods.',                                                                                                       'Boston, MA',   42.3601, -71.0589, 30, false, 0,  'pending');
-- vendors.rating / review_count are maintained by the reviews trigger.

-- ---------------------------------------------------------------------
-- Vendor categories
-- ---------------------------------------------------------------------
insert into vendor_categories (vendor_id, category) values
  ('b0000001-0000-0000-0000-000000000001','decor'),
  ('b0000001-0000-0000-0000-000000000001','balloons'),
  ('b0000002-0000-0000-0000-000000000002','cake'),
  ('b0000003-0000-0000-0000-000000000003','catering'),
  ('b0000003-0000-0000-0000-000000000003','bartender'),
  ('b0000004-0000-0000-0000-000000000004','rentals'),
  ('b0000005-0000-0000-0000-000000000005','photography'),
  ('b0000005-0000-0000-0000-000000000005','videography'),
  ('b0000006-0000-0000-0000-000000000006','dj'),
  ('b0000006-0000-0000-0000-000000000006','photobooth'),
  ('b0000007-0000-0000-0000-000000000007','florals'),
  ('b0000007-0000-0000-0000-000000000007','decor'),
  ('b0000008-0000-0000-0000-000000000008','bartender'),
  ('b0000009-0000-0000-0000-000000000009','decor');

-- ---------------------------------------------------------------------
-- Services (starting prices power the budget score)
-- ---------------------------------------------------------------------
insert into services (vendor_id, category, name, description, starting_price) values
  ('b0000001-0000-0000-0000-000000000001','decor','Organic balloon garland','8ft garland in your palette, delivered and installed', 450),
  ('b0000001-0000-0000-0000-000000000001','decor','Backdrop + garland package','Circle or shimmer-wall backdrop with a full garland and signage ledge', 850),
  ('b0000001-0000-0000-0000-000000000001','balloons','Balloon numbers / mosaic','Foil number or custom mosaic frame filled to your colors', 220),
  ('b0000002-0000-0000-0000-000000000002','cake','Two-tier custom cake','Serves ~30, buttercream finish, simple florals', 185),
  ('b0000002-0000-0000-0000-000000000002','cake','Dessert table','Cake plus 3 mini desserts, styled to your theme', 425),
  ('b0000003-0000-0000-0000-000000000003','catering','Plated dinner service','Three courses, staffing and rentals coordination, per 50 guests from', 2100),
  ('b0000003-0000-0000-0000-000000000003','bartender','Bar staffing add-on','Two bartenders for 4 hours', 520),
  ('b0000004-0000-0000-0000-000000000004','rentals','Tables, chairs & linens','Per 50 guests: rounds, chairs, floor-length linens', 375),
  ('b0000004-0000-0000-0000-000000000004','rentals','Lounge furniture set','Two sofas, four chairs, coffee + side tables, rug', 640),
  ('b0000005-0000-0000-0000-000000000005','photography','Event coverage — 3 hours','One photographer, edited gallery, print release', 900),
  ('b0000005-0000-0000-0000-000000000005','videography','Highlight film','60–90 second social edit plus full ceremony/toasts', 1200),
  ('b0000006-0000-0000-0000-000000000006','dj','DJ + MC — 4 hours','Full sound, wireless mics, dance-floor lighting', 700),
  ('b0000006-0000-0000-0000-000000000006','photobooth','Open-air photo booth','3 hours, props, unlimited prints, digital gallery', 500),
  ('b0000007-0000-0000-0000-000000000007','florals','Centerpieces','Low garden-style arrangements, price each from', 65),
  ('b0000007-0000-0000-0000-000000000007','florals','Statement installation','Arbor or hanging install, design + install + strike', 1400),
  ('b0000007-0000-0000-0000-000000000007','decor','Tablescape styling','Candles, vessels, runners and place settings styling', 380),
  ('b0000008-0000-0000-0000-000000000008','bartender','Signature bar package','2 bartenders, 2 signature drinks, mixers, glassware, 4 hours', 675),
  ('b0000009-0000-0000-0000-000000000009','decor','Custom signage suite','Welcome sign, bar menu, table numbers', 260);

-- ---------------------------------------------------------------------
-- Packages
-- ---------------------------------------------------------------------
insert into packages (vendor_id, name, description, price) values
  ('b0000001-0000-0000-0000-000000000001','The Statement','Backdrop, full garland, balloon number, signage ledge, delivery, install & strike', 1250),
  ('b0000003-0000-0000-0000-000000000003','Celebration Buffet — 75 guests','Buffet dinner, two sides, salad, rolls, staffing, chafers', 2850),
  ('b0000005-0000-0000-0000-000000000005','Photo + Highlight Film','3 hours photo, 90-second film, both galleries', 1900);

-- ---------------------------------------------------------------------
-- Portfolio photos (Unsplash — allowed in next.config images)
-- ---------------------------------------------------------------------
insert into vendor_photos (vendor_id, url, sort) values
  ('b0000001-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=70', 0),
  ('b0000001-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=1200&q=70', 1),
  ('b0000002-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=1200&q=70', 0),
  ('b0000002-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=70', 1),
  ('b0000003-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&q=70', 0),
  ('b0000004-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=70', 0),
  ('b0000005-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=70', 0),
  ('b0000006-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=70', 0),
  ('b0000007-0000-0000-0000-000000000007','https://images.unsplash.com/photo-1478146059778-26028b07395a?w=1200&q=70', 0),
  ('b0000008-0000-0000-0000-000000000008','https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=70', 0);

-- ---------------------------------------------------------------------
-- Reviews (trigger recomputes vendors.rating / review_count)
-- ---------------------------------------------------------------------
-- We need booking rows to hang reviews on; create a couple of historical
-- bookings for Jerrica-independent past events is overkill for seed, so
-- instead we insert reviews directly against a throwaway past event.
insert into events (id, client_id, name, event_type, event_date, location, latitude, longitude, guest_count, budget, style, status)
values ('e0000000-0000-0000-0000-0000000000ff','22222222-2222-2222-2222-222222222222','(seed) Past event','birthday', current_date - 120, 'Boston, MA', 42.3601, -71.0589, 60, 6000, 'modern elegant', 'completed');

insert into quotes (id, event_id, vendor_id, category, status, subtotal, deposit, total)
values
  ('c0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000ff','b0000001-0000-0000-0000-000000000001','decor','accepted',850,300,850),
  ('c0000000-0000-0000-0000-0000000000a2','e0000000-0000-0000-0000-0000000000ff','b0000002-0000-0000-0000-000000000002','cake','accepted',185,60,185),
  ('c0000000-0000-0000-0000-0000000000a3','e0000000-0000-0000-0000-0000000000ff','b0000005-0000-0000-0000-000000000005','photography','accepted',900,300,900);

insert into bookings (id, event_id, vendor_id, quote_id, category, status, total, deposit_paid, balance) values
  ('d0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000ff','b0000001-0000-0000-0000-000000000001','c0000000-0000-0000-0000-0000000000a1','decor','completed',850,850,0),
  ('d0000000-0000-0000-0000-0000000000a2','e0000000-0000-0000-0000-0000000000ff','b0000002-0000-0000-0000-000000000002','c0000000-0000-0000-0000-0000000000a2','cake','completed',185,185,0),
  ('d0000000-0000-0000-0000-0000000000a3','e0000000-0000-0000-0000-0000000000ff','b0000005-0000-0000-0000-000000000005','c0000000-0000-0000-0000-0000000000a3','photography','completed',900,900,0);

insert into reviews (booking_id, client_id, vendor_id, rating, communication, quality, value, comment) values
  ('d0000000-0000-0000-0000-0000000000a1','22222222-2222-2222-2222-222222222222','b0000001-0000-0000-0000-000000000001',5,5,5,4,'The backdrop was stunning and setup was seamless.'),
  ('d0000000-0000-0000-0000-0000000000a2','22222222-2222-2222-2222-222222222222','b0000002-0000-0000-0000-000000000002',5,5,5,5,'Cake tasted as good as it looked.'),
  ('d0000000-0000-0000-0000-0000000000a3','22222222-2222-2222-2222-222222222222','b0000005-0000-0000-0000-000000000005',5,5,5,5,'Photos were back in a week and everyone asked who shot them.');

-- A few more ratings so the marketplace doesn't look empty.
insert into events (id, client_id, name, event_type, event_date, status)
values ('e0000000-0000-0000-0000-0000000000fe','22222222-2222-2222-2222-222222222222','(seed) Past event 2','wedding', current_date - 200, 'completed');
insert into quotes (id, event_id, vendor_id, category, status, subtotal, deposit, total) values
  ('c0000000-0000-0000-0000-0000000000b1','e0000000-0000-0000-0000-0000000000fe','b0000003-0000-0000-0000-000000000003','catering','accepted',3200,1000,3200),
  ('c0000000-0000-0000-0000-0000000000b2','e0000000-0000-0000-0000-0000000000fe','b0000004-0000-0000-0000-000000000004','rentals','accepted',720,250,720),
  ('c0000000-0000-0000-0000-0000000000b3','e0000000-0000-0000-0000-0000000000fe','b0000006-0000-0000-0000-000000000006','dj','accepted',700,200,700),
  ('c0000000-0000-0000-0000-0000000000b4','e0000000-0000-0000-0000-0000000000fe','b0000007-0000-0000-0000-000000000007','florals','accepted',1400,500,1400),
  ('c0000000-0000-0000-0000-0000000000b5','e0000000-0000-0000-0000-0000000000fe','b0000008-0000-0000-0000-000000000008','bartender','accepted',675,200,675);
insert into bookings (id, event_id, vendor_id, quote_id, category, status, total, deposit_paid, balance) values
  ('d0000000-0000-0000-0000-0000000000b1','e0000000-0000-0000-0000-0000000000fe','b0000003-0000-0000-0000-000000000003','c0000000-0000-0000-0000-0000000000b1','catering','completed',3200,3200,0),
  ('d0000000-0000-0000-0000-0000000000b2','e0000000-0000-0000-0000-0000000000fe','b0000004-0000-0000-0000-000000000004','c0000000-0000-0000-0000-0000000000b2','rentals','completed',720,720,0),
  ('d0000000-0000-0000-0000-0000000000b3','e0000000-0000-0000-0000-0000000000fe','b0000006-0000-0000-0000-000000000006','c0000000-0000-0000-0000-0000000000b3','dj','completed',700,700,0),
  ('d0000000-0000-0000-0000-0000000000b4','e0000000-0000-0000-0000-0000000000fe','b0000007-0000-0000-0000-000000000007','c0000000-0000-0000-0000-0000000000b4','florals','completed',1400,1400,0),
  ('d0000000-0000-0000-0000-0000000000b5','e0000000-0000-0000-0000-0000000000fe','b0000008-0000-0000-0000-000000000008','c0000000-0000-0000-0000-0000000000b5','bartender','completed',675,675,0);
insert into reviews (booking_id, client_id, vendor_id, rating, communication, quality, value, comment) values
  ('d0000000-0000-0000-0000-0000000000b1','22222222-2222-2222-2222-222222222222','b0000003-0000-0000-0000-000000000003',5,4,5,4,'Guests are still talking about the short rib.'),
  ('d0000000-0000-0000-0000-0000000000b2','22222222-2222-2222-2222-222222222222','b0000004-0000-0000-0000-000000000004',4,4,4,4,'Everything arrived on time, linens were pressed.'),
  ('d0000000-0000-0000-0000-0000000000b3','22222222-2222-2222-2222-222222222222','b0000006-0000-0000-0000-000000000006',5,5,4,5,'Read the room perfectly, dance floor stayed full.'),
  ('d0000000-0000-0000-0000-0000000000b4','22222222-2222-2222-2222-222222222222','b0000007-0000-0000-0000-000000000007',5,5,5,4,'The arbor was a showstopper.'),
  ('d0000000-0000-0000-0000-0000000000b5','22222222-2222-2222-2222-222222222222','b0000008-0000-0000-0000-000000000008',4,5,4,4,'Signature drinks were a hit.');

-- ---------------------------------------------------------------------
-- A live demo event for Jerrica with open requests to match against
-- ---------------------------------------------------------------------
insert into events (id, client_id, name, event_type, event_date, location, latitude, longitude, guest_count, budget, style, color_palette, status)
values ('e1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111',
        'Jerrica''s 36th Birthday','birthday', current_date + 60,
        'Brockton, MA', 42.0834, -71.0184, 50, 6000, 'modern elegant', 'Pink · White · Gold', 'planning');

insert into event_requests (event_id, category, status) values
  ('e1111111-1111-1111-1111-111111111111','decor','open'),
  ('e1111111-1111-1111-1111-111111111111','cake','open'),
  ('e1111111-1111-1111-1111-111111111111','photography','open'),
  ('e1111111-1111-1111-1111-111111111111','dj','open');

select public.seed_event_checklist('e1111111-1111-1111-1111-111111111111');

insert into guests (event_id, name, email, party_size, rsvp) values
  ('e1111111-1111-1111-1111-111111111111','Alex Rivera','alex@example.com',2,'yes'),
  ('e1111111-1111-1111-1111-111111111111','Sam Okafor','sam@example.com',1,'yes'),
  ('e1111111-1111-1111-1111-111111111111','Dana Lin','dana@example.com',2,'pending'),
  ('e1111111-1111-1111-1111-111111111111','Chris Bello',null,1,'no');
