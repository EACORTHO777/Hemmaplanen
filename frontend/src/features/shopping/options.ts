import type { CSSProperties } from "react";

export const UNITS = ["st", "kg", "g"] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORIES = [
  "Frukt & grönt",
  "Skafferi",
  "Kaffe",
  "Bakning",
  "Kött & fisk",
  "Mejeri",
  "Frysvaror",
  "Hygien",
  "Hushåll",
  "Leå",
  "Pasta",
  "Ris",
  "Ketchup",
  "Drycker",
  "Njiåm",
] as const;

export type Section = {
  title: string;
  short: string;
  color: string;
  categories: readonly string[];
};

// Store walking order, same as the old app. `color` is the light-mode tone;
// the CSS derives chip, text and ring colors from it for both themes.
export const SECTIONS: Section[] = [
  { title: "Frukt & grönt", short: "Frukt", color: "#C9E2B3", categories: ["Frukt & grönt", "Skafferi"] },
  { title: "Kaffe & bakning", short: "Kaffe & bak", color: "#D9C2A7", categories: ["Kaffe", "Bakning"] },
  { title: "Kött & fisk", short: "Kött & fisk", color: "#F2C4BE", categories: ["Kött & fisk"] },
  { title: "Mejeri & frys", short: "Mejeri", color: "#C3D8F0", categories: ["Mejeri", "Frysvaror"] },
  { title: "Hygien & hushåll", short: "Hygien", color: "#DCD1EE", categories: ["Hygien", "Hushåll", "Leå"] },
  { title: "Pasta, ris & ketchup", short: "Pasta & ris", color: "#F0DC9E", categories: ["Pasta", "Ris", "Ketchup"] },
  { title: "Drycker & njiåm", short: "Drycker", color: "#BCE1E3", categories: ["Drycker", "Njiåm"] },
];

export const OTHER_SECTION: Section = {
  title: "Övrigt",
  short: "Övrigt",
  color: "#E2E1E6",
  categories: [],
};

export function sectionFor(category: string | null): Section {
  return (
    SECTIONS.find((s) => category !== null && s.categories.includes(category)) ??
    OTHER_SECTION
  );
}

// Lets an element (and its children) use the section's tone in CSS via `.tone`
export function toneStyle(color: string): CSSProperties {
  return { "--section": color } as CSSProperties;
}

// Ported and extended from the old app's AUTO_RULES
const AUTO_RULES: { words: string[]; category: string }[] = [
  { words: ["banan", "äpple", "äpplen", "päron", "potatis", "tomat", "gurka", "lök", "sallad", "avokado", "morot", "morötter", "paprika", "citron", "lime", "vindruv", "apelsin"], category: "Frukt & grönt" },
  { words: ["bröd", "knäcke", "flingor", "müsli", "havregryn", "konserv", "bönor"], category: "Skafferi" },
  { words: ["kaffe", "te"], category: "Kaffe" },
  { words: ["mjöl", "socker", "jäst", "bakpulver", "vanilj"], category: "Bakning" },
  { words: ["kyckling", "lax", "köttfärs", "färs", "fläsk", "korv", "bacon", "räkor", "torsk", "fisk", "biff"], category: "Kött & fisk" },
  { words: ["mjölk", "ost", "smör", "yoghurt", "kvarg", "fil", "grädde", "gräddfil", "crème", "creme", "ägg"], category: "Mejeri" },
  { words: ["glass", "fryst", "frysta"], category: "Frysvaror" },
  { words: ["schampo", "tandkräm", "tvål", "deodorant", "balsam", "bomull"], category: "Hygien" },
  { words: ["diskmedel", "tvättmedel", "toapapper", "hushållspapper", "soppåsar", "folie"], category: "Hushåll" },
  { words: ["blöjor", "välling", "barnmat"], category: "Leå" },
  { words: ["pasta", "spagetti", "makaroner", "nudlar"], category: "Pasta" },
  { words: ["ris"], category: "Ris" },
  { words: ["ketchup", "senap"], category: "Ketchup" },
  { words: ["läsk", "juice", "vatten", "öl", "vin", "cola"], category: "Drycker" },
  { words: ["chips", "godis", "choklad", "kakor", "popcorn"], category: "Njiåm" },
];

// The longest matching keyword wins, so "mjölk" beats "mjöl"
export function guessCategory(name: string): string | null {
  const words = name.toLowerCase().split(/\s+/);
  let best: { category: string; length: number } | null = null;
  for (const rule of AUTO_RULES) {
    for (const keyword of rule.words) {
      const matches = words.some((word) => word.startsWith(keyword));
      if (matches && keyword.length > (best?.length ?? 0)) {
        best = { category: rule.category, length: keyword.length };
      }
    }
  }
  return best?.category ?? null;
}
