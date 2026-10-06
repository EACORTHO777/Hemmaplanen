// Date helpers. Dates are handled as local "YYYY-MM-DD" strings, the same format
// as Postgres `date` columns, so there are no time zone surprises.

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

// ISO 8601 week number, the one used in Sweden ("vecka 41")
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = d.getUTCDay() || 7; // Monday = 1 … Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber); // Thursday decides the year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export type CalendarWeek = {
  week: number;
  days: Date[]; // Monday to Sunday
};

// Every week that touches the given month (month is 1–12)
export function monthWeeks(year: number, month: number): CalendarWeek[] {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // back to Monday

  const weeks: CalendarWeek[] = [];
  const cursor = new Date(start);
  while (cursor.getMonth() === month - 1 || weeks.length === 0 || cursor < first) {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ week: isoWeek(days[0]), days });
  }
  return weeks;
}

export const WEEKDAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

export function monthName(year: number, month: number): string {
  const name = new Intl.DateTimeFormat("sv-SE", { month: "long" }).format(
    new Date(year, month - 1, 1),
  );
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function longDate(iso: string): string {
  const text = new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fromIsoDate(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
