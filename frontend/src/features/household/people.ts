import type { Database } from "../../types/database";

type Member = Database["public"]["Tables"]["members"]["Row"];

export type Person = {
  id: string | null;
  name: string;
  color: string;
};

// Same soft palette as the store sections, assigned in the order people joined
const PERSON_COLORS = ["#C3D8F0", "#F2C4BE", "#C9E2B3", "#F0DC9E", "#DCD1EE", "#BCE1E3"];

// To-dos assigned to nobody are shared by everyone
export const EVERYONE: Person = { id: null, name: "Gemensamt", color: "#E2E1E6" };

export function toPeople(members: Member[]): Person[] {
  return members.map((member, index) => ({
    id: member.id,
    name: member.display_name,
    color: PERSON_COLORS[index % PERSON_COLORS.length],
  }));
}
