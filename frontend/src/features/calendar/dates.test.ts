import { describe, expect, it } from "vitest";
import { addDays, isoWeek, monthWeeks, toIsoDate } from "./dates";

describe("isoWeek", () => {
  it("gives the Swedish week number", () => {
    expect(isoWeek(new Date(2026, 9, 6))).toBe(41); // 6 Oct 2026
  });

  it("handles weeks that cross the new year", () => {
    expect(isoWeek(new Date(2026, 11, 31))).toBe(53); // 2026 has 53 weeks
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53); // still week 53
    expect(isoWeek(new Date(2027, 0, 4))).toBe(1);
  });
});

describe("monthWeeks", () => {
  it("starts every row on a Monday", () => {
    for (const week of monthWeeks(2026, 2)) {
      expect(week.days[0].getDay()).toBe(1); // Monday
      expect(week.days).toHaveLength(7);
    }
  });

  it("covers the whole month", () => {
    const weeks = monthWeeks(2026, 3);
    expect(toIsoDate(weeks[0].days[0])).toBe("2026-02-23");
    expect(toIsoDate(weeks.at(-1)!.days[6])).toBe("2026-04-05");
  });
});

describe("addDays", () => {
  it("moves across months", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
});
