-- Push subscriptions: each user only manages their own devices, in their own household
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'fia@test.local', '{"full_name":"Fia"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'gus@test.local', '{"full_name":"Gus"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select set_config('test.fia_home', public.create_household('Fias hem')::text, true);

select lives_ok(
  format(
    'insert into public.push_subscriptions (household_id, endpoint, p256dh, auth) values (%L, %L, %L, %L)',
    current_setting('test.fia_home'), 'https://push.example/fia', 'key', 'secret'
  ),
  'A user can save their own device'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select set_config('test.gus_home', public.create_household('Gus hem')::text, true);

select is_empty(
  'select * from public.push_subscriptions',
  'Another user cannot see someone else''s devices'
);
select throws_ok(
  format(
    'insert into public.push_subscriptions (household_id, endpoint, p256dh, auth) values (%L, %L, %L, %L)',
    current_setting('test.fia_home'), 'https://push.example/gus', 'key', 'secret'
  ),
  '42501',
  null,
  'A user cannot subscribe to a household they are not in'
);
select is_empty(
  'delete from public.push_subscriptions returning id',
  'A user cannot delete someone else''s devices'
);

select * from finish();
rollback;
