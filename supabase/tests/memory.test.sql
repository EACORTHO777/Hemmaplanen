-- The shopping list learns how each household buys things (trigger remember_item)
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000d', 'dan@test.local', '{"full_name":"Dan"}'),
  ('00000000-0000-0000-0000-00000000000e', 'eva@test.local', '{"full_name":"Eva"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select set_config('test.household', public.create_household('Dans hem')::text, true);

insert into public.shopping_items (household_id, name, amount, unit, category)
values (current_setting('test.household')::uuid, '  Bananer ', 1, 'kg', 'Frukt & grönt');

select results_eq(
  $$ select name_key, amount, unit, category from public.item_memory $$,
  $$ values ('bananer', 1::numeric, 'kg', 'Frukt & grönt') $$,
  'Adding an item teaches the household''s memory (lower-case, trimmed)'
);

update public.shopping_items set amount = 6, unit = 'st' where name = '  Bananer ';
select results_eq(
  $$ select amount, unit from public.item_memory where name_key = 'bananer' $$,
  $$ values (6::numeric, 'st') $$,
  'Changing the item updates the memory'
);

insert into public.shopping_items (household_id, name, amount, unit)
values (current_setting('test.household')::uuid, 'bananer', 2, 'kg');
select is(
  (select count(*)::int from public.item_memory),
  1,
  'The same item is remembered once, not duplicated'
);

-- Another household cannot see this household's habits
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select is_empty(
  'select * from public.item_memory',
  'Another household cannot read the memory'
);

select * from finish();
rollback;
