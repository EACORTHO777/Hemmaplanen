create table public.medicine_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  medicine text not null check (medicine in ('alvedon', 'ipren')),
  given_at timestamptz not null default now(),
  given_by uuid references auth.users(id) on delete set null
);

