create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  amount numeric,
  unit text,
  category text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

