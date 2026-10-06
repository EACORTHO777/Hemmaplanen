import type { Database } from "../../types/database";

export type Medicine = Database["public"]["Tables"]["medicines"]["Row"];

// Quick picks for a new medicine, from the same soft palette as the rest of the app
export const MEDICINE_COLORS = [
  "#C3D8F0",
  "#C9E2B3",
  "#F2C4BE",
  "#F0DC9E",
  "#DCD1EE",
  "#BCE1E3",
  "#D9C2A7",
];

export function formatInterval(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
