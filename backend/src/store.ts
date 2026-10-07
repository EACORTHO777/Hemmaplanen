import type { AdminClient } from "./supabase.ts";

export type Subscription = { endpoint: string; p256dh: string; auth: string };

export type DueReminder = {
  household_id: string;
  person: string;
  medicine: string;
  level: 1 | 2 | 3;
  given_at: string;
};

// Everything the API reads from the database, behind an interface so tests can use a fake.
// The admin client bypasses RLS, so the API checks membership itself before acting.
// Database errors are thrown (and logged as 500s) instead of silently returning nothing.
export interface Store {
  findItem(itemId: string): Promise<{ householdId: string; name: string } | null>;
  findMember(userId: string, householdId: string): Promise<{ displayName: string } | null>;
  subscriptionsForUser(userId: string): Promise<Subscription[]>;
  // exceptUserId: leave out the person who caused the notification (null = everyone)
  subscriptionsForHousehold(householdId: string, exceptUserId: string | null): Promise<Subscription[]>;
  claimMedicineReminders(): Promise<DueReminder[]>;
  removeSubscription(endpoint: string): Promise<void>;
}

export function supabaseStore(supabase: AdminClient): Store {
  return {
    async findItem(itemId) {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("household_id, name")
        .eq("id", itemId)
        .maybeSingle();
      if (error) throw error;
      return data ? { householdId: data.household_id, name: data.name } : null;
    },

    async findMember(userId, householdId) {
      const { data, error } = await supabase
        .from("members")
        .select("display_name")
        .eq("user_id", userId)
        .eq("household_id", householdId)
        .maybeSingle();
      if (error) throw error;
      return data ? { displayName: data.display_name } : null;
    },

    async subscriptionsForUser(userId) {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },

    async subscriptionsForHousehold(householdId, exceptUserId) {
      let query = supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("household_id", householdId);
      if (exceptUserId) query = query.neq("user_id", exceptUserId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    // Marks and returns doses that reached a new reminder level (see the migration)
    async claimMedicineReminders() {
      const { data, error } = await supabase.rpc("claim_medicine_reminders");
      if (error) throw error;
      return data as DueReminder[];
    },

    async removeSubscription(endpoint) {
      const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      if (error) throw error;
    },
  };
}
