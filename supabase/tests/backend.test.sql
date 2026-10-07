-- The backend (role service_role, used with the secret key) only gets what it needs.
-- This also catches the case where the backend silently can't read a table.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select ok(has_table_privilege('service_role', 'public.push_subscriptions', 'select'), 'Backend can read push subscriptions');
select ok(has_table_privilege('service_role', 'public.push_subscriptions', 'delete'), 'Backend can remove expired push subscriptions');
select ok(has_table_privilege('service_role', 'public.shopping_items', 'select'), 'Backend can read shopping items');
select ok(has_table_privilege('service_role', 'public.members', 'select'), 'Backend can read member names');

select ok(not has_table_privilege('service_role', 'public.shopping_items', 'insert'), 'Backend cannot add shopping items');
select ok(not has_table_privilege('service_role', 'public.medicine_logs', 'select'), 'Backend cannot read medicine history');

select * from finish();
rollback;
