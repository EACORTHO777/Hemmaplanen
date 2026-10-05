create policy "Members view their household"
on public.households
for select
to authenticated
using (public.is_household_member(id));

create policy "Members view co-members"
on public.members
for select
to authenticated
using (public.is_household_member(household_id));
