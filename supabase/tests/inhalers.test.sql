-- Inhaler counter: puffs left, today/yesterday, "Ny inhalator", and household isolation
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'ida@test.local', '{"full_name":"Ida"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'jon@test.local', '{"full_name":"Jon"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select set_config('test.home', public.create_household('Idas hem')::text, true);
insert into public.members (household_id, display_name) values (current_setting('test.home')::uuid, 'Barn');

insert into public.inhalers (household_id, member_id, name, color, remaining_at_start)
select current_setting('test.home')::uuid, id, 'Blå', '#C3D8F0', 25 from public.members where display_name = 'Barn';
select set_config('test.blue', (select id::text from public.inhalers where name = 'Blå'), true);

create function pg_temp.puff(ago interval) returns void language sql as $$
  insert into public.inhaler_puffs (household_id, inhaler_id, given_at)
  values (current_setting('test.home')::uuid, current_setting('test.blue')::uuid, now() - ago);
$$;

-- 3 puffs today, 2 yesterday (the 2 yesterday were before this inhaler started, so they don't count)
update public.inhalers set started_at = now() - interval '1 minute' - (extract(hour from (now() at time zone 'Europe/Stockholm')) * interval '1 hour')
where id = current_setting('test.blue')::uuid;
select pg_temp.puff(interval '0 minutes');
select pg_temp.puff(interval '0 minutes');
select pg_temp.puff(interval '0 minutes');
select pg_temp.puff(interval '1 day');
select pg_temp.puff(interval '1 day');

select is((select today from public.inhaler_overview), 3, 'Counts today''s puffs');
select is((select yesterday from public.inhaler_overview), 2, 'Counts yesterday''s puffs');
select is((select remaining from public.inhaler_overview), 22, 'Puffs left = 25 at start minus 3 since the inhaler started');
select ok((select remaining <= warn_at from public.inhaler_overview) = false, 'Not low yet at 22 left (warns at 20)');

-- "Ny inhalator": full again
update public.inhalers set remaining_at_start = capacity, started_at = now() + interval '1 second'
where id = current_setting('test.blue')::uuid;
select is((select remaining from public.inhaler_overview), 120, '"Ny inhalator" sets it back to 120');

-- Another household sees nothing and can't log puffs here
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select set_config('test.other', public.create_household('Jons hem')::text, true);
select is_empty('select * from public.inhaler_overview', 'Another household cannot see the inhaler');
select is_empty('select * from public.inhaler_puffs', 'Another household cannot see the puffs');
select throws_ok(
  format('insert into public.inhaler_puffs (household_id, inhaler_id) values (%L, %L)',
         current_setting('test.home'), current_setting('test.blue')),
  '42501', null,
  'Another household cannot log puffs on it'
);

select * from finish();
rollback;
