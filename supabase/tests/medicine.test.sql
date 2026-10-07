-- The medicine rule lives in the database (trigger check_medicine_interval),
-- so it holds even if someone bypasses the app and talks to the API directly.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000c', 'cia@test.local', '{"full_name":"Cia"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select set_config('test.household', public.create_household('Cias hem')::text, true);

insert into public.members (household_id, display_name)
values (current_setting('test.household')::uuid, 'Barn');
select set_config('test.child', (select id::text from public.members where display_name = 'Barn'), true);
select set_config('test.alvedon', (select id::text from public.medicines where name = 'Alvedon'), true);
select set_config('test.ipren', (select id::text from public.medicines where name = 'Ipren'), true);

-- A helper so each test reads as "give X at time T"
create function pg_temp.give(medicine text, at_time timestamptz) returns void
language sql as $$
  insert into public.medicine_logs (household_id, medicine_id, given_to, given_at)
  values (
    current_setting('test.household')::uuid,
    current_setting(medicine)::uuid,
    current_setting('test.child')::uuid,
    at_time
  );
$$;

select lives_ok(
  $$ select pg_temp.give('test.alvedon', now() - interval '5 hours') $$,
  'First dose is accepted'
);
select throws_ok(
  $$ select pg_temp.give('test.alvedon', now() - interval '2 hours') $$,
  'P0001',
  'För tidigt: det ska gå minst 4 timmar mellan doserna',
  'A second Alvedon within 4 hours is refused'
);
select lives_ok(
  $$ select pg_temp.give('test.ipren', now() - interval '2 hours') $$,
  'A different medicine at the same time is fine'
);
select lives_ok(
  $$ select pg_temp.give('test.alvedon', now()) $$,
  'Alvedon again after 5 hours is fine'
);
select throws_ok(
  $$ select pg_temp.give('test.ipren', now() + interval '1 hour') $$,
  'P0001',
  'Tiden kan inte vara i framtiden',
  'A dose in the future is refused'
);

-- Changing the time of a dose: it must not clash with itself, but with others it must
select lives_ok(
  $$ update public.medicine_logs set given_at = given_at - interval '10 minutes'
     where medicine_id = current_setting('test.ipren')::uuid $$,
  'Moving a dose a little does not count against itself'
);
select throws_ok(
  $$ update public.medicine_logs set given_at = now() - interval '1 hour'
     where medicine_id = current_setting('test.alvedon')::uuid
       and given_at < now() - interval '4 hours' $$,
  'P0001',
  'För tidigt: det ska gå minst 4 timmar mellan doserna',
  'Moving a dose next to another one is refused'
);

-- Each medicine has its own interval
update public.medicines set min_interval_minutes = 60 where id = current_setting('test.ipren')::uuid;
select lives_ok(
  $$ select pg_temp.give('test.ipren', now() - interval '10 minutes') $$,
  'A medicine with a 1-hour interval can be given again after 1 hour 50 minutes'
);

select * from finish();
rollback;
