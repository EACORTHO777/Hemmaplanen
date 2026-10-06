-- Each household has its own medicines: a name, a color and the minimum
-- time between two doses for the same person.
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  min_interval_minutes integer not null check (min_interval_minutes between 15 and 2880),
  created_at timestamptz not null default now(),
  unique (household_id, id)
);

alter table public.medicines enable row level security;
revoke all on public.medicines from anon, authenticated;
grant select, insert, update, delete on public.medicines to authenticated;

create policy "Members manage medicines"
on public.medicines
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

alter publication supabase_realtime add table public.medicines;

-- Existing households start with Alvedon and Ipren, 4 hours apart like the old app
insert into public.medicines (household_id, name, color, min_interval_minutes)
select id, 'Alvedon', '#C3D8F0', 240 from public.households
union all
select id, 'Ipren', '#C9E2B3', 240 from public.households;

-- Logs point at a medicine row instead of a fixed name
alter table public.medicine_logs add column medicine_id uuid;

update public.medicine_logs l
set medicine_id = m.id
from public.medicines m
where m.household_id = l.household_id
  and lower(m.name) = l.medicine;

alter table public.medicine_logs alter column medicine_id set not null;
alter table public.medicine_logs
  add constraint medicine_logs_medicine_fkey
  foreign key (household_id, medicine_id)
  references public.medicines (household_id, id)
  on delete cascade;

alter table public.medicine_logs drop column medicine;

create index medicine_logs_latest_idx
  on public.medicine_logs (household_id, given_to, medicine_id, given_at desc);

-- The app may only write these columns
revoke insert on public.medicine_logs from authenticated;
grant insert (household_id, medicine_id, given_to, given_at) on public.medicine_logs to authenticated;

-- New households also start with Alvedon and Ipren
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

  insert into public.medicines (household_id, name, color, min_interval_minutes)
  values
    (new_id, 'Alvedon', '#C3D8F0', 240),
    (new_id, 'Ipren', '#C9E2B3', 240);

  return new_id;
end;
$$;
