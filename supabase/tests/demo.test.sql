-- "Prova demo": anonymous visitors get their own demo household, isolated from real ones
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, is_anonymous, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', null, true, '{}'),
  ('00000000-0000-0000-0000-0000000000d2', 'real@test.local', false, '{"full_name":"Real"}');

set local role authenticated;

-- A real user with a real household
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated","is_anonymous":false}', true);
select set_config('test.real', public.create_household('Riktigt hem')::text, true);
select set_config('test.real_code', (select invite_code from public.households), true);

select throws_ok(
  $$ select public.create_demo_household() $$,
  'P0001', 'Only demo users get a demo household',
  'A real user cannot create a demo household'
);

-- An anonymous visitor presses "Prova demo"
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated","is_anonymous":true}', true);
select set_config('test.demo', public.create_demo_household()::text, true);

select ok((select is_demo from public.households where id = current_setting('test.demo')::uuid), 'The visitor gets a demo household');
select is(public.create_demo_household(), current_setting('test.demo')::uuid, 'Pressing it again reuses the same demo household');
select is((select count(*)::int from public.members), 4, 'The demo has 4 made-up family members');
select is((select count(*)::int from public.shopping_items), 8, 'The demo has a shopping list');
select is((select count(*)::int from public.events), 5, 'The demo has calendar events');
select is((select remaining from public.inhaler_overview), 67, 'The demo inhaler shows puffs left');

select throws_ok(
  format('select public.join_household(%L)', current_setting('test.real_code')),
  'P0001', 'Demo users cannot join households',
  'A demo user cannot join a real household, even with the right code'
);
select throws_ok(
  $$ select public.create_household('Smyg') $$,
  'P0001', 'Demo users cannot create households',
  'A demo user cannot create a real household'
);
select is((select count(*)::int from public.households), 1, 'A demo user only sees their own demo household');

-- After a day, the cleanup job removes the demo
reset role;
update public.households set created_at = now() - interval '2 days' where id = current_setting('test.demo')::uuid;
update auth.users set created_at = now() - interval '2 days' where id = '00000000-0000-0000-0000-0000000000d1';
select is(public.cleanup_demo(), 1, 'The cleanup removes demo households older than a day');
select ok(
  not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000d1')
  and exists (select 1 from public.households where id = current_setting('test.real')::uuid),
  'The anonymous user is removed, the real household is untouched'
);

select * from finish();
rollback;
