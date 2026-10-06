-- A medicine can belong to one person (e.g. an asthma inhaler for one child).
-- member_id = null means it's for everyone in the household (Alvedon, Ipren).
alter table public.medicines add column member_id uuid;

-- The person must be in the same household; removing them removes their medicines
alter table public.medicines
  add constraint medicines_member_fkey
  foreign key (household_id, member_id)
  references public.members (household_id, id)
  on delete cascade;
