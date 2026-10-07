import type { AdminClient } from "./supabase.ts";

export type Subscription = { endpoint: string; p256dh: string; auth: string };

// Everything the API reads from the database, behind an interface so tests can use a fake.
// The admin client bypasses RLS, so the API checks membership itself before acting.
export interface Store {
  findItem(itemId: string): Promise<{ householdId: string; name: string } | null>;
  findMember(userId: string, householdId: string): Promise<{ displayName: string } | null>;
  subscriptionsForUser(userId: string): Promise<Subscription[]>;
  subscriptionsForHousehold(householdId: string, exceptUserId: string): Promise<Subscription[]>;
  removeSubscription(endpoint: string): Promise<void>;
}

export function supabaseStore(supabase: AdminClient): Store {
  return {
    async findItem(itemId) {
      const { data } = await supabase
        .from("shopping_items")
        .select("household_id, name")
        .eq("id", itemId)
        .maybeSingle();
      return data ? { householdId: data.household_id, name: data.name } : null;
    },

    async findMember(userId, householdId) {
      const { data } = await supabase
        .from("members")
        .select("display_name")
        .eq("user_id", userId)
        .eq("household_id", householdId)
        .maybeSingle();
      return data ? { displayName: data.display_name } : null;
    },

    async subscriptionsForUser(userId) {
      const { data } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);
      return data ?? [];
    },

    async subscriptionsForHousehold(householdId, exceptUserId) {
      const { data } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("household_id", householdId)
        .neq("user_id", exceptUserId);
      return data ?? [];
    },

    async removeSubscription(endpoint) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    },
  };
}
