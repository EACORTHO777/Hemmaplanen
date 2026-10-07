-- Medicine reminders: the right level, once, only for the newest dose
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', 'hanna@test.local', '{"full_name":"Hanna"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select set_config('test.home', public.create_household('Hannas hem')::text, true);
insert into public.members (household_id, display_name) values (current_setting('test.home')::uuid, 'Lea');
select set_config('test.lea', (select id::text from public.members where display_name = 'Lea'), true);
select set_config('test.alvedon', (select id::text from public.medicines where name = 'Alvedon'), true);
select set_config('test.ipren', (select id::text from public.medicines where name = 'Ipren'), true);

create function pg_temp.give(medicine text, ago interval) returns void language sql as $$
  insert into public.medicine_logs (household_id, medicine_id, given_to, given_at)
  values (current_setting('test.home')::uuid, current_setting(medicine)::uuid, current_setting('test.lea')::uuid, now() - ago);
$$;

-- Alvedon 4 h 10 min ago, Ipren 1 hour ago
select pg_temp.give('test.alvedon', interval '4 hours 10 minutes');
select pg_temp.give('test.ipren', interval '1 hour');

reset role;

select results_eq(
  'select person, medicine, level from public.claim_medicine_reminders()',
  $$ values ('Lea', 'Alvedon', 1::smallint) $$,
  'After 4 hours: "Nu kan Lea få Alvedon igen", nothing for Ipren yet'
);
select is_empty(
  'select * from public.claim_medicine_reminders()',
  'The same reminder is never sent twice'
);

-- Two hours later the dose is 6 h 10 min old
update public.medicine_logs set given_at = now() - interval '6 hours 10 minutes'
where medicine_id = current_setting('test.alvedon')::uuid;
select is(
  (select reminder_level from public.medicine_logs where medicine_id = current_setting('test.alvedon')::uuid),
  0::smallint,
  'Changing the time starts the reminders over'
);
select results_eq(
  'select level from public.claim_medicine_reminders()',
  $$ values (2::smallint) $$,
  'After 6 hours: "Lea bör få Alvedon nu"'
);

update public.medicine_logs set given_at = now() - interval '8 hours 5 minutes', reminder_level = 2
where medicine_id = current_setting('test.alvedon')::uuid;
select results_eq(
  'select level from public.claim_medicine_reminders()',
  $$ values (3::smallint) $$,
  'After 8 hours: "GE Lea Alvedon NU!"'
);

-- A new dose replaces the old one, so the old one stops reminding
update public.medicine_logs set given_at = now() - interval '3 days', reminder_level = 0
where medicine_id = current_setting('test.alvedon')::uuid;
select is_empty(
  'select * from public.claim_medicine_reminders()',
  'A dose from days ago is marked but not sent (job was down)'
);

select ok(
  not has_function_privilege('authenticated', 'public.claim_medicine_reminders()', 'execute'),
  'Logged-in users cannot run the reminder job'
);
select ok(
  has_function_privilege('service_role', 'public.claim_medicine_reminders()', 'execute'),
  'The backend job can run it'
);

select * from finish();
rollback;
