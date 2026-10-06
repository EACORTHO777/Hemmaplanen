create function public.check_medicine_interval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.medicine_logs
    where household_id = new.household_id
      and given_to = new.given_to 
      and medicine = new.medicine
      and given_at > new.given_at - interval '4 hours'
      and given_at < new.given_at + interval '4 hours'
  ) then
    raise exception 'Det har inte gått 4 timmar sedan förra dosen %', new.medicine;
  end if;
  return new;
end;
$$;

create trigger medicine_interval_check
before insert on public.medicine_logs
for each row execute function public.check_medicine_interval();
