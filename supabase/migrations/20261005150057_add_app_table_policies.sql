create policy "Members manage shopping items"
on public.shopping_items
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Members manage events"
on public.events
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Members manage todos"
on public.todos
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Members manage medicine_logs"
on public.medicine_logs
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
