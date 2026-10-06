-- Every dose is given TO a member of the same household (e.g. a child).
-- Removing a member also removes their medicine history (health data, GDPR).
alter table public.medicine_logs add column given_to uuid not null;

alter table public.medicine_logs
  add constraint medicine_logs_given_to_fkey
  foreign key (household_id, given_to)
  references public.members (household_id, id)
  on delete cascade;

-- given_by is always the logged-in user, never something the client sends
alter table public.medicine_logs alter column given_by set default auth.uid();

-- The app may only write these columns. Logs are never edited, only deleted.
revoke insert, update on public.medicine_logs from authenticated;
grant insert (household_id, medicine, given_to, given_at) on public.medicine_logs to authenticated;

-- "Latest dose of X for person Y" is the most common lookup
create index medicine_logs_latest_idx
  on public.medicine_logs (household_id, given_to, medicine, given_at desc);

alter publication supabase_realtime add table public.medicine_logs;
