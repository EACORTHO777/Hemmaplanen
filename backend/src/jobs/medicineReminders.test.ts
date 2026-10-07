import { describe, expect, it } from "vitest";
import { fakePush, fakeStore } from "../test/fakes.ts";
import { reminderMessage, sendMedicineReminders } from "./medicineReminders.ts";

describe("reminderMessage", () => {
  it("uses the old app's three levels", () => {
    expect(reminderMessage({ person: "LEÅ", medicine: "Alvedon", level: 1 }).body).toBe("Nu kan LEÅ få Alvedon igen");
    expect(reminderMessage({ person: "LEÅ", medicine: "Alvedon", level: 2 }).body).toBe("LEÅ bör få Alvedon nu");
    expect(reminderMessage({ person: "LEÅ", medicine: "Alvedon", level: 3 }).body).toBe("GE LEÅ Alvedon NU!");
  });
});

describe("sendMedicineReminders", () => {
  it("notifies everyone in the household", async () => {
    const store = fakeStore();
    store.claimMedicineReminders = async () => [
      { household_id: "h1", person: "LEÅ", medicine: "Ipren", level: 2, given_at: "2026-10-07T06:00:00Z" },
    ];
    const push = fakePush();

    const result = await sendMedicineReminders(store, push);

    expect(result).toEqual({ reminders: 1, delivered: 2 });
    const [subscriptions, payload] = push.mock.calls[0];
    expect(subscriptions.map((s) => s.endpoint)).toEqual(["https://push.example/user-1", "https://push.example/user-2"]);
    expect(payload.body).toBe("LEÅ bör få Ipren nu");
  });

  it("does nothing when no reminder is due", async () => {
    const push = fakePush();
    expect(await sendMedicineReminders(fakeStore(), push)).toEqual({ reminders: 0, delivered: 0 });
    expect(push).not.toHaveBeenCalled();
  });
});
