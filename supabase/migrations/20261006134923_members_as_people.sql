-- Members become "people in the household". A member with user_id = null is
-- someone without a login (e.g. a child) who can still be assigned to-dos,
-- events and medicine.

alter table public.members add column id uuid not null default gen_random_uuid();
alter table public.members add column display_name text;

update public.members m
set display_name = coalesce(u.raw_user_meta_data ->> 'full_name', u.email, 'Okänd')
from auth.users u
where u.id = m.user_id;

alter table public.members alter column display_name set not null;
alter table public.members drop constraint members_pkey;
alter table public.members add primary key (id);
alter table public.members alter column user_id drop not null;

-- A login can only join a household once (several null user_ids are allowed)
alter table public.members
  add constraint members_household_user_key unique (household_id, user_id);

-- Lets other tables require that an assigned member is in the SAME household
alter table public.members
  add constraint members_household_member_key unique (household_id, id);

-- assigned_to now points at a member of the same household instead of a login.
-- "set null (assigned_to)" keeps household_id when the member is removed.
alter table public.todos drop constraint todos_assigned_to_fkey;
alter table public.todos
  add constraint todos_assigned_to_fkey
  foreign key (household_id, assigned_to)
  references public.members (household_id, id)
  on delete set null (assigned_to);

alter table public.events drop constraint events_assigned_to_fkey;
alter table public.events
  add constraint events_assigned_to_fkey
  foreign key (household_id, assigned_to)
  references public.members (household_id, id)
  on delete set null (assigned_to);

-- The logged-in user's name from their Google profile
create function public.current_display_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(raw_user_meta_data ->> 'full_name', email, 'Okänd')
  from auth.users
  where id = auth.uid();
$$;

revoke execute on function public.current_display_name() from public, anon;

-- Creating and joining now also store the member's name
create or replace function public.create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.households (name)
  values (household_name)
  returning id into new_id;

  insert into public.members (household_id, user_id, display_name)
  values (new_id, auth.uid(), public.current_display_name());

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
  select id into found_id
  from public.households
  where invite_code = code;

  if found_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.members (household_id, user_id, display_name)
  values (found_id, auth.uid(), public.current_display_name())
  on conflict do nothing;

  return found_id;
end;
$$;
