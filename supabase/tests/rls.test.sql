-- Row Level Security: one household can never see or change another household's data.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- Two users, each with their own household
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@test.local', '{"full_name":"Anna"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bo@test.local', '{"full_name":"Bo"}');

set local role authenticated;

-- Anna creates a household and adds an item
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select set_config('test.household_a', public.create_household('Annas hem')::text, true);
insert into public.shopping_items (household_id, name)
values (current_setting('test.household_a')::uuid, 'Mjölk');

select is(
  (select count(*)::int from public.shopping_items), 1,
  'Anna sees her own item'
);
select is(
  (select display_name from public.members), 'Anna',
  'create_household stores the member''s name from Google'
);
select is(
  (select count(*)::int from public.medicines), 2,
  'A new household starts with Alvedon and Ipren'
);

-- Bo creates his own household
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select set_config('test.household_b', public.create_household('Bos hem')::text, true);

select is(
  (select count(*)::int from public.shopping_items), 0,
  'Bo cannot see Anna''s items'
);
select is(
  (select count(*)::int from public.households), 1,
  'Bo only sees his own household'
);
select throws_ok(
  format(
    'insert into public.shopping_items (household_id, name) values (%L, %L)',
    current_setting('test.household_a'), 'Inbrott'
  ),
  '42501',
  null,
  'Bo cannot add items to Anna''s household'
);
select is_empty(
  format(
    'update public.shopping_items set name = %L where household_id = %L returning id',
    'Ändrad', current_setting('test.household_a')
  ),
  'Bo cannot change Anna''s items'
);
select is_empty(
  format(
    'delete from public.shopping_items where household_id = %L returning id',
    current_setting('test.household_a')
  ),
  'Bo cannot delete Anna''s items'
);

-- Members: people without login can be added, but nobody can hijack a login
select lives_ok(
  format(
    'insert into public.members (household_id, display_name) values (%L, %L)',
    current_setting('test.household_b'), 'Barn'
  ),
  'Bo can add a person without login to his household'
);
select throws_ok(
  format(
    'insert into public.members (household_id, display_name, user_id) values (%L, %L, %L)',
    current_setting('test.household_b'), 'Anna', '00000000-0000-0000-0000-00000000000a'
  ),
  '42501',
  null,
  'Bo cannot add Anna''s login to his household'
);

-- Joining needs the right invite code
select throws_ok(
  $$ select public.join_household('fel-kod') $$,
  'P0001',
  'Invalid invite code',
  'A wrong invite code is rejected'
);

-- Not logged in: no access at all
reset role;
set local role anon;
select throws_ok(
  'select * from public.shopping_items',
  '42501',
  null,
  'Someone who is not logged in cannot read anything'
);

select * from finish();
rollback;
