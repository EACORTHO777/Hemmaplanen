-- Asthma inhalers: count puffs, show how many are left, warn when almost empty.
-- An inhaler belongs to one member (e.g. a child). "Ny inhalator" sets
-- remaining_at_start back to capacity and started_at to now; puffs before
-- started_at stay in the history but no longer count against the inhaler.
create table public.inhalers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_id uuid not null,
  name text not null check (char_length(name) between 1 and 40),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  capacity integer not null default 120 check (capacity between 1 and 1000),
  remaining_at_start integer not null default 120 check (remaining_at_start between 0 and 1000),
  started_at timestamptz not null default now(),
  warn_at integer not null default 20 check (warn_at between 0 and 1000),
  created_at timestamptz not null default now(),
  unique (household_id, id),
  foreign key (household_id, member_id) references public.members (household_id, id) on delete cascade
);

-- One row per puff
create table public.inhaler_puffs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  inhaler_id uuid not null,
  given_at timestamptz not null default now(),
  given_by uuid default auth.uid() references auth.users (id) on delete set null,
  foreign key (household_id, inhaler_id) references public.inhalers (household_id, id) on delete cascade
);

create index inhaler_puffs_inhaler_time_idx on public.inhaler_puffs (inhaler_id, given_at desc);

alter table public.inhalers enable row level security;
alter table public.inhaler_puffs enable row level security;
revoke all on public.inhalers, public.inhaler_puffs from anon, authenticated, service_role;
grant select, insert, update, delete on public.inhalers to authenticated;
grant select, delete on public.inhaler_puffs to authenticated;
grant insert (household_id, inhaler_id, given_at) on public.inhaler_puffs to authenticated;

create policy "Members manage their household's inhalers"
on public.inhalers for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Members log puffs in their household"
on public.inhaler_puffs for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- Everything the inhaler card shows, computed in the database.
-- security_invoker: the caller's RLS applies, so households only see their own.
-- "Today" and "yesterday" follow Swedish time.
create view public.inhaler_overview
with (security_invoker = true) as
select
  i.id,
  i.household_id,
  i.member_id,
  i.name,
  i.color,
  i.capacity,
  i.warn_at,
  i.started_at,
  greatest(0, i.remaining_at_start - count(p.id) filter (where p.given_at >= i.started_at))::int as remaining,
  count(p.id) filter (
    where (p.given_at at time zone 'Europe/Stockholm')::date = (now() at time zone 'Europe/Stockholm')::date
  )::int as today,
  count(p.id) filter (
    where (p.given_at at time zone 'Europe/Stockholm')::date = (now() at time zone 'Europe/Stockholm')::date - 1
  )::int as yesterday,
  max(p.given_at) as last_puff_at
from public.inhalers i
left join public.inhaler_puffs p on p.inhaler_id = i.id
group by i.id;

grant select on public.inhaler_overview to authenticated;

alter publication supabase_realtime add table public.inhalers, public.inhaler_puffs;
