-- Checking off an item logs a purchase (trigger log_purchase)
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

update public.shopping_items set done = true where name = '  Bananer ';
select is ((select count(*)::int from public.purchase_history), 1, 'Checking off an item logs a purchase');

update public.shopping_items set done = false where name = '  Bananer ';
select is ((select count(*)::int from public.purchase_history), 0, 'Uncheck Bananer and check that purchase is gone'); 

update public.shopping_items set done = true where name = '  Bananer ';
delete from public.shopping_items where name = '  Bananer ';
select is ((select count(*)::int from public.purchase_history), 1, 'Rensa klara should keep the history');
-- Another household cannot see this household's habits
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select is_empty(
  'select * from public.purchase_history',
  'Another household cannot read the purchase history'
);

select * from finish();
rollback;
