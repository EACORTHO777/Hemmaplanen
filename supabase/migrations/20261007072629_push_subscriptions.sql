-- One row per phone/browser that has turned on notifications.
-- The backend reads these (with the secret key) to send Web Push messages.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  endpoint text not null unique, -- the push service URL for this device
  p256dh text not null,          -- the device's public key
  auth text not null,            -- the device's auth secret
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant insert (household_id, endpoint, p256dh, auth) on public.push_subscriptions to authenticated;

-- Each user only ever sees and manages their own devices,
-- and can only subscribe for a household they belong to
create policy "Users manage their own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and public.is_household_member(household_id));
