-- The minimum time between doses now comes from each medicine instead of a fixed 4 hours
create or replace function public.check_medicine_interval()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  gap integer;
begin
  if new.given_at > now() + interval '1 minute' then
    raise exception 'Tiden kan inte vara i framtiden';
  end if;

  -- How many minutes this medicine needs between doses
  select min_interval_minutes into gap
  from public.medicines
  where id = new.medicine_id;

  if exists (
    select 1
    from public.medicine_logs
    where household_id = new.household_id
      and given_to = new.given_to
      and medicine_id = new.medicine_id
      and id <> new.id
      and given_at > new.given_at - make_interval(mins => gap)
      and given_at < new.given_at + make_interval(mins => gap)
  ) then
    raise exception 'För tidigt: det ska gå minst % timmar mellan doserna',
      trim_scale(round(gap / 60.0, 1));
  end if;
  return new;
end;
$$;
