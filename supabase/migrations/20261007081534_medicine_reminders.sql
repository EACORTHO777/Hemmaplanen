-- Medicine reminders, same levels as the old app (for a 4-hour medicine):
--   1 = 4 h "Nu kan … få … igen"   (1× the minimum interval)
--   2 = 6 h "… bör få … nu"        (1.5×)
--   3 = 8 h "GE … NU!"             (2×)
-- reminder_level remembers the highest reminder already sent for a dose.
alter table public.medicine_logs add column reminder_level smallint not null default 0;

-- Doses logged before reminders existed should not suddenly remind
update public.medicine_logs set reminder_level = 3;

-- Moving a dose with "Ändra tid" starts its reminders over
create function public.reset_medicine_reminder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reminder_level := 0;
  return new;
end;
$$;

create trigger medicine_logs_reset_reminder
before update of given_at on public.medicine_logs
for each row execute function public.reset_medicine_reminder();

-- Finds doses that reached a new level, marks them as reminded and returns them,
-- all in one statement, so two jobs running at once can never send the same reminder.
-- Only the newest dose per person and medicine counts.
create function public.claim_medicine_reminders()
returns table (household_id uuid, person text, medicine text, level smallint, given_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  with latest as (
    select distinct on (l.given_to, l.medicine_id)
      l.id, l.household_id, l.given_at, m.name as medicine, m.min_interval_minutes, p.display_name as person
    from public.medicine_logs l
    join public.medicines m on m.id = l.medicine_id
    join public.members p on p.id = l.given_to
    order by l.given_to, l.medicine_id, l.given_at desc
  ),
  reached as (
    select *,
      case
        when now() >= given_at + make_interval(mins => min_interval_minutes * 2) then 3
        when now() >= given_at + make_interval(mins => min_interval_minutes * 3 / 2) then 2
        when now() >= given_at + make_interval(mins => min_interval_minutes) then 1
        else 0
      end::smallint as level
    from latest
  ),
  claimed as (
    update public.medicine_logs l
    set reminder_level = r.level
    from reached r
    where l.id = r.id and r.level > l.reminder_level
    returning r.household_id, r.person, r.medicine, r.level, r.given_at, r.min_interval_minutes
  )
  select household_id, person, medicine, level, given_at
  from claimed
  -- If the job was down for a long time, don't send reminders that are hours out of date
  where now() < given_at + make_interval(mins => min_interval_minutes * 2 + 120);
$$;

-- Only the backend job may run it
revoke execute on function public.claim_medicine_reminders() from public, anon, authenticated;
grant execute on function public.claim_medicine_reminders() to service_role;
