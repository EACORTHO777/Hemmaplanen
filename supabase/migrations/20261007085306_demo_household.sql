-- "Prova demo": visitors sign in anonymously and get their OWN demo household
-- with made-up sample data. Demo users can never reach real households, and
-- everything is deleted after a day (see cleanup_demo below).
alter table public.households add column is_demo boolean not null default false;

create function public.is_anonymous_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- Anonymous (demo) users may not create or join real households
create or replace function public.create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if public.is_anonymous_user() then
    raise exception 'Demo users cannot create households';
  end if;

  insert into public.households (name)
  values (household_name)
  returning id into new_id;

  insert into public.members (household_id, user_id, display_name)
  values (new_id, auth.uid(), public.current_display_name());

  insert into public.medicines (household_id, name, color, min_interval_minutes)
  values
    (new_id, 'Alvedon', '#C3D8F0', 240),
    (new_id, 'Ipren', '#C9E2B3', 240);

  return new_id;
end;
$$;

create or replace function public.join_household(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_id uuid;
begin
  if public.is_anonymous_user() then
    raise exception 'Demo users cannot join households';
  end if;

  select id into found_id
  from public.households
  where invite_code = code and not is_demo;

  if found_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.members (household_id, user_id, display_name)
  values (found_id, auth.uid(), public.current_display_name())
  on conflict do nothing;

  return found_id;
end;
$$;

-- Creates a demo household full of made-up sample data for the calling anonymous user.
-- Dates are relative to today, so the demo always looks fresh.
create function public.create_demo_household()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  home uuid;
  me uuid;
  alex uuid;
  sam uuid;
  my uuid;
  alvedon uuid;
  inhaler uuid;
  today date := (now() at time zone 'Europe/Stockholm')::date;
begin
  if not public.is_anonymous_user() then
    raise exception 'Only demo users get a demo household';
  end if;

  -- One demo household per visitor
  select m.household_id into home
  from public.members m
  where m.user_id = auth.uid();
  if home is not null then
    return home;
  end if;

  insert into public.households (name, is_demo) values ('Demofamiljen', true) returning id into home;

  insert into public.members (household_id, user_id, display_name)
  values (home, auth.uid(), 'Du') returning id into me;
  insert into public.members (household_id, display_name) values (home, 'Alex') returning id into alex;
  insert into public.members (household_id, display_name) values (home, 'Sam') returning id into sam;
  insert into public.members (household_id, display_name) values (home, 'Lilla My') returning id into my;

  insert into public.shopping_items (household_id, name, amount, unit, category, done) values
    (home, 'Mjölk', 2, 'st', 'Mejeri', false),
    (home, 'Bananer', 1, 'kg', 'Frukt & grönt', false),
    (home, 'Gurka', 1, 'st', 'Frukt & grönt', true),
    (home, 'Kycklingfilé', 900, 'g', 'Kött & fisk', false),
    (home, 'Pasta', 2, 'st', 'Pasta', false),
    (home, 'Kaffe', 1, 'st', 'Kaffe', false),
    (home, 'Diskmedel', 1, 'st', 'Hushåll', false),
    (home, 'Glass', 1, 'st', 'Frysvaror', true);

  insert into public.events (household_id, title, date, time, assigned_to) values
    (home, 'Fotbollsträning', today, '17:00', sam),
    (home, 'Tandläkare', today + 1, '14:30', my),
    (home, 'Middag hos mormor', today + 3, '18:00', null),
    (home, 'Föräldramöte', today + 6, '18:30', alex),
    (home, 'Städdag', today + 9, null, null);

  insert into public.todos (household_id, title, assigned_to, done) values
    (home, 'Byta glödlampa i hallen', alex, false),
    (home, 'Boka tvättid', null, false),
    (home, 'Köpa present till kalaset', me, false),
    (home, 'Ringa förskolan', alex, true);

  insert into public.medicines (household_id, name, color, min_interval_minutes)
  values (home, 'Alvedon', '#C3D8F0', 240) returning id into alvedon;
  insert into public.medicines (household_id, name, color, min_interval_minutes)
  values (home, 'Ipren', '#C9E2B3', 240);

  -- Lilla My got Alvedon 3 hours ago, so the demo shows the timer running
  insert into public.medicine_logs (household_id, medicine_id, given_to, given_at)
  values (home, alvedon, my, now() - interval '3 hours');

  insert into public.inhalers (household_id, member_id, name, color, remaining_at_start, started_at)
  values (home, my, 'Blå', '#C3D8F0', 70, now() - interval '3 days') returning id into inhaler;
  insert into public.inhaler_puffs (household_id, inhaler_id, given_at) values
    (home, inhaler, now() - interval '26 hours'),
    (home, inhaler, now() - interval '25 hours'),
    (home, inhaler, now() - interval '2 hours');

  return home;
end;
$$;

revoke execute on function public.create_demo_household() from public, anon;
grant execute on function public.create_demo_household() to authenticated;

-- Deletes demo households and anonymous users older than a day.
-- Run by a scheduled GitHub Action (which also keeps the free Supabase project active).
create function public.cleanup_demo()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from public.households
  where is_demo and created_at < now() - interval '1 day';
  get diagnostics removed = row_count;

  delete from auth.users
  where is_anonymous and created_at < now() - interval '1 day';

  return removed;
end;
$$;

revoke execute on function public.cleanup_demo() from public, anon, authenticated;
grant execute on function public.cleanup_demo() to service_role;
