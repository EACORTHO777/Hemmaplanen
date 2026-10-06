-- The app may only write these columns, so nobody can change user_id
revoke insert, update on public.members from authenticated;
grant insert (household_id, display_name) on public.members to authenticated;
grant update (display_name) on public.members to authenticated;

create policy "Members add people to their household"
on public.members
for insert
to authenticated
with check (public.is_household_member(household_id) and user_id is null);

create policy "Members rename people in their household"
on public.members
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Members remove people from their household"
on public.members
for delete
to authenticated
using (public.is_household_member(household_id));
