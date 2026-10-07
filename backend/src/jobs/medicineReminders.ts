import type { PushPayload, PushSender } from "../push.ts";
import type { DueReminder, Store } from "../store.ts";

// Same wording as the old Alvedon app's three levels
export function reminderMessage(reminder: Pick<DueReminder, "person" | "medicine" | "level">): PushPayload {
  const { person, medicine, level } = reminder;
  const body =
    level === 1
      ? `Nu kan ${person} få ${medicine} igen`
      : level === 2
        ? `${person} bör få ${medicine} nu`
        : `GE ${person} ${medicine} NU!`;
  return { title: "Medicin", body, url: "/" };
}

// One run of the reminder job: claim due reminders, notify each household
export async function sendMedicineReminders(store: Store, push: PushSender) {
  const due = await store.claimMedicineReminders();
  let delivered = 0;
  for (const reminder of due) {
    const subscriptions = await store.subscriptionsForHousehold(reminder.household_id, null);
    delivered += await push(subscriptions, reminderMessage(reminder));
  }
  return { reminders: due.length, delivered };
}
