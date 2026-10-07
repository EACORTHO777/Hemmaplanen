import type { Database } from "../../types/database";
import { guessCategory, UNITS, type Unit } from "./options";
import type { ParsedItem } from "./parse";

export type Memory = Database["public"]["Tables"]["item_memory"]["Row"];

export type Suggestion = {
  name: string;
  amount: number;
  unit: Unit;
  category: string | null;
  remembered: boolean;
};

export function memoryKey(name: string) {
  return name.trim().toLowerCase();
}

// What quick add should save. What the user typed always wins, then what the
// household usually buys (item_memory), then a keyword guess for the category.
export function suggest(parsed: ParsedItem, memory: Map<string, Memory>): Suggestion {
  const remembered = memory.get(memoryKey(parsed.name));
  const rememberedUnit = UNITS.find((u) => u === remembered?.unit);

  return {
    name: parsed.name,
    amount: parsed.amountTyped ? parsed.amount : (remembered?.amount ?? parsed.amount),
    unit: parsed.unitTyped ? parsed.unit : (rememberedUnit ?? parsed.unit),
    category: remembered?.category ?? guessCategory(parsed.name),
    remembered: remembered !== undefined,
  };
}
