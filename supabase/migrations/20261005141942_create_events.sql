create table public.events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  date date not null,
  time time,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

