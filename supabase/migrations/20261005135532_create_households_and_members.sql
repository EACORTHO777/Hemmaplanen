create table public.households (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  created_at timestamptz not null default now()
);

create table public.members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);