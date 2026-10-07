import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./parse";
import { suggest, type Memory } from "./suggest";

const bananas: Memory = {
  household_id: "h1",
  name_key: "bananer",
  amount: 1,
  unit: "kg",
  category: "Frukt & grönt",
  updated_at: "2026-10-07T08:00:00Z",
};
const memory = new Map([[bananas.name_key, bananas]]);

describe("suggest", () => {
  it("uses what the household usually buys", () => {
    expect(suggest(parseQuickAdd("bananer"), memory)).toEqual({
      name: "Bananer",
      amount: 1,
      unit: "kg",
      category: "Frukt & grönt",
      remembered: true,
    });
  });

  it("lets a typed amount win but keeps the remembered unit", () => {
    const result = suggest(parseQuickAdd("2 bananer"), memory);
    expect(result.amount).toBe(2);
    expect(result.unit).toBe("kg");
  });

  it("lets a typed unit win", () => {
    expect(suggest(parseQuickAdd("6 st bananer"), memory).unit).toBe("st");
  });

  it("matches regardless of upper case and spaces", () => {
    expect(suggest(parseQuickAdd("  BANANER "), memory).remembered).toBe(true);
  });

  it("falls back to the keyword guess for new items", () => {
    expect(suggest(parseQuickAdd("mjölk"), memory)).toEqual({
      name: "Mjölk",
      amount: 1,
      unit: "st",
      category: "Mejeri",
      remembered: false,
    });
  });
});
