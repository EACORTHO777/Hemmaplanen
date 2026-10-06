create or replace function public.check_medicine_interval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.given_at > now() + interval '1 minute' then
    raise exception 'Tiden kan inte vara i framtiden';
  end if;

  if exists (
    select 1
    from public.medicine_logs
    where household_id = new.household_id
      and given_to = new.given_to
      and medicine = new.medicine
      and id <> new.id
      and given_at > new.given_at - interval '4 hours'
      and given_at < new.given_at + interval '4 hours'
  ) then
    raise exception 'Det har inte gått 4 timmar sedan förra dosen %', new.medicine;
  end if;
  return new;
end;
$$;

drop trigger medicine_interval_check on public.medicine_logs;

create trigger medicine_interval_check
before insert or update of given_at on public.medicine_logs
for each row execute function public.check_medicine_interval();

-- Only the time may be changed, nothing else
grant update (given_at) on public.medicine_logs to authenticated;
