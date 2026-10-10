-- One row each time an item is checked off, so the app can learn
-- what the household usually buys and how often
create table public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name_key text not null, -- lower-case, trimmed item name, e.g. 'bananer'
  bought_at timestamptz not null default now(),
  shopping_item_id uuid references public.shopping_items (id) on delete set null
);

-- Logs a purchase when an item is checked off, and takes it back if it's unchecked
create function public.log_purchase()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done and not old.done then
    insert into public.purchase_history (household_id, name_key, shopping_item_id)
    values (new.household_id, lower(trim(new.name)), new.id);
  elsif old.done and not new.done then
    delete from public.purchase_history
    where shopping_item_id = new.id;
  end if;
  return new;
end;
$$;

create trigger shopping_items_log_purchase
after update of done on public.shopping_items
for each row execute function public.log_purchase();
alter table public.purchase_history enable row level security;

revoke all on public.purchase_history from anon, authenticated, service_role;
grant select, insert, delete on public.purchase_history to authenticated;

create policy "Members use their household's purchase history"
on public.purchase_history
for all 
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));