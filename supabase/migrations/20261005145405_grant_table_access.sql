revoke all on public.households, public.members, public.shopping_items, public.events, public.todos, public.medicine_logs from anon, authenticated;
grant select, insert, update, delete on public.households, public.members, public.shopping_items, public.events, public.todos, public.medicine_logs to authenticated;
