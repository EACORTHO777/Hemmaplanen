create function public.create_household(household_name text)
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

  insert into public.members (household_id, user_id)
  values (new_id, auth.uid());

  return new_id;
end;
$$;

grant execute on function public.create_household(text) to authenticated;
