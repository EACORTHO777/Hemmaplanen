import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./parse";

describe("parseQuickAdd", () => {
  it("reads amount before the name", () => {
    expect(parseQuickAdd("2 mjölk")).toEqual({
      name: "Mjölk",
      amount: 2,
      unit: "st",
      amountTyped: true,
      unitTyped: false,
    });
  });

  it("reads amount and unit", () => {
    expect(parseQuickAdd("1 kg bananer")).toEqual({
      name: "Bananer",
      amount: 1,
      unit: "kg",
      amountTyped: true,
      unitTyped: true,
    });
  });

  it("reads amount after the name", () => {
    expect(parseQuickAdd("mjölk 2")).toEqual({
      name: "Mjölk",
      amount: 2,
      unit: "st",
      amountTyped: true,
      unitTyped: false,
    });
  });

  it("understands Swedish decimal comma", () => {
    expect(parseQuickAdd("1,5 kg potatis").amount).toBe(1.5);
  });

  it("leaves the amount empty when there is none", () => {
    expect(parseQuickAdd("grekisk yoghurt")).toEqual({
      name: "Grekisk yoghurt",
      amount: 1,
      unit: "st",
      amountTyped: false,
      unitTyped: false,
    });
  });
});
