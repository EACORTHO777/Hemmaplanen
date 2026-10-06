create function public.join_household(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_id uuid;
begin
  select id into found_id
  from public.households
  where invite_code = code;

  if found_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.members (household_id, user_id)
  values (found_id, auth.uid())
  on conflict do nothing;

  return found_id;
end;
$$;

grant execute on function public.join_household(text) to authenticated;
