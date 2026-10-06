// Swedish name days and holidays from the free "Svenska dagar" API (api.dryg.net).
// The calendar works without it: if the request fails we just show no name days.

export type SwedishDay = {
  date: string; // "2026-10-06"
  nameDays: string[];
  holiday: string | null;
  flagDay: string | null;
  isRedDay: boolean;
};

type ApiDay = {
  datum: string;
  namnsdag: string[];
  helgdag?: string;
  flaggdag: string;
  "röd dag": string;
};

const cache = new Map<string, Promise<SwedishDay[]>>();

export function fetchSwedishMonth(year: number, month: number): Promise<SwedishDay[]> {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const request = fetch(`https://api.dryg.net/dagar/v2.1/${year}/${String(month).padStart(2, "0")}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Svenska dagar API: ${response.status}`);
      return response.json() as Promise<{ dagar: ApiDay[] }>;
    })
    .then((data) =>
      data.dagar.map((day) => ({
        date: day.datum,
        nameDays: day.namnsdag,
        holiday: day.helgdag ?? null,
        flagDay: day.flaggdag || null,
        isRedDay: day["röd dag"] === "Ja",
      })),
    )
    .catch(() => {
      cache.delete(key); // try again next time
      return [];
    });

  cache.set(key, request);
  return request;
}
