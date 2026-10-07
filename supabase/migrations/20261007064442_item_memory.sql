-- The shopping list's memory: how this household usually buys each item,
-- e.g. "bananer" → 1 kg, Frukt & grönt. Shared between everyone in the household.
create table public.item_memory (
  household_id uuid not null references public.households (id) on delete cascade,
  name_key text not null, -- lower-case, trimmed item name, e.g. 'bananer'
  amount numeric,
  unit text,
  category text,
  updated_at timestamptz not null default now(),
  primary key (household_id, name_key)
);

alter table public.item_memory enable row level security;
revoke all on public.item_memory from anon, authenticated;
grant select, insert, update, delete on public.item_memory to authenticated;

create policy "Members use their household's item memory"
on public.item_memory
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- Start with what is already on the shopping lists
insert into public.item_memory (household_id, name_key, amount, unit, category)
select distinct on (household_id, lower(trim(name)))
  household_id, lower(trim(name)), amount, unit, category
from public.shopping_items
order by household_id, lower(trim(name)), created_at desc;
