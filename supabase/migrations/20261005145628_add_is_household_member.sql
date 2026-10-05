create function public.is_household_member(hid uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
  select 1 from public.members where household_id = hid and user_id = auth.uid()
  );
$$;
grant execute on function public.is_household_member(uuid) to authenticated;
