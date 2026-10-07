create function public.remember_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.item_memory (household_id, name_key, amount, unit, category)
  values (new.household_id, lower(trim(new.name)), new.amount, new.unit, new.category)
  on conflict (household_id, name_key) do update
  set amount = excluded.amount,
    unit = excluded.unit,
    category = excluded.category,
    updated_at = now();
  return new;
end;
$$;

create trigger shopping_items_remember
after insert or update of name, amount, unit, category on public.shopping_items
for each row execute function public.remember_item();