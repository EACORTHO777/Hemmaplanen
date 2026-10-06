export type Medicine = {
  id: "alvedon" | "ipren"; // must match the check constraint on medicine_logs
  name: string;
  color: string;
};

export const MEDICINES: Medicine[] = [
  { id: "alvedon", name: "Alvedon", color: "#C3D8F0" },
  { id: "ipren", name: "Ipren", color: "#C9E2B3" },
];

export function medicineName(id: string) {
  return MEDICINES.find((m) => m.id === id)?.name ?? id;
}
