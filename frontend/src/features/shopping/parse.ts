import type { Unit } from "./options";

export type ParsedItem = {
  name: string;
  amount: number;
  unit: Unit;
  // Whether the user actually typed them, so remembered values can fill the gaps
  amountTyped: boolean;
  unitTyped: boolean;
};

// "2 mjölk", "1 kg bananer", "500g kaffe" or "mjölk 2"
const LEADING = /^(\d+(?:[.,]\d+)?)\s*(st|kg|g)?\s+(.+)$/i;
const TRAILING = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(st|kg|g)?$/i;

export function parseQuickAdd(text: string): ParsedItem {
  const trimmed = text.trim();
  const leading = trimmed.match(LEADING);
  const trailing = trimmed.match(TRAILING);

  let name = trimmed;
  let amountText: string | undefined;
  let unitText: string | undefined;

  if (leading) {
    [, amountText, unitText, name] = leading;
  } else if (trailing) {
    [, name, amountText, unitText] = trailing;
  }

  name = name.trim();
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount: amountText ? Number(amountText.replace(",", ".")) : 1,
    unit: (unitText?.toLowerCase() as Unit | undefined) ?? "st",
    amountTyped: amountText !== undefined,
    unitTyped: unitText !== undefined,
  };
}
