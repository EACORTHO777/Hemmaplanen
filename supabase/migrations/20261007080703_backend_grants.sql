-- The backend talks to the database with the secret key, which uses the role
-- service_role. New tables in this project are not exposed automatically, so the
-- backend gets exactly what it needs and nothing more (least privilege).
-- Start from zero so local and cloud databases have the same permissions.
revoke all on
  public.households,
  public.members,
  public.shopping_items,
  public.events,
  public.todos,
  public.medicines,
  public.medicine_logs,
  public.item_memory,
  public.push_subscriptions
from service_role;

-- Notifications: who added what, and which phones to notify
grant select on public.shopping_items, public.members, public.push_subscriptions to service_role;
-- Forget phones that turned notifications off
grant delete on public.push_subscriptions to service_role;
