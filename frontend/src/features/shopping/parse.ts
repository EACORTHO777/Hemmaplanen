import type { Unit } from "./options";

export type ParsedItem = {
  name: string;
  amount: number;
  unit: Unit;
};

// "2 mjölk", "1 kg bananer", "500g kaffe" or "mjölk 2"
const LEADING = /^(\d+(?:[.,]\d+)?)\s*(st|kg|g)?\s+(.+)$/i;
const TRAILING = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(st|kg|g)?$/i;

export function parseQuickAdd(text: string): ParsedItem {
  const trimmed = text.trim();
  const leading = trimmed.match(LEADING);
  const trailing = trimmed.match(TRAILING);

  let name = trimmed;
  let amount = 1;
  let unit: Unit = "st";

  if (leading) {
    [, , , name] = leading;
    amount = Number(leading[1].replace(",", "."));
    unit = (leading[2]?.toLowerCase() as Unit | undefined) ?? "st";
  } else if (trailing) {
    name = trailing[1];
    amount = Number(trailing[2].replace(",", "."));
    unit = (trailing[3]?.toLowerCase() as Unit | undefined) ?? "st";
  }

  name = name.trim();
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount,
    unit,
  };
}
