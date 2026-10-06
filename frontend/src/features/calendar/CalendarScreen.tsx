import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { fetchSwedishMonth, type SwedishDay } from "../../lib/swedishDays";
import type { Database } from "../../types/database";
import { EVERYONE, toPeople } from "../household/people";
import { addDays, fromIsoDate, isoWeek, longDate, toIsoDate } from "./dates";
import MonthGrid from "./MonthGrid";
import "./calendar.css";

type CalendarEvent = Database["public"]["Tables"]["events"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

type Props = {
  householdId: string;
};

// ["Jenny", "Jennifer"] → "Jenny och Jennifer"
function joinNames(names: string[]) {
  if (names.length < 2) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} och ${names[names.length - 1]}`;
}

export default function CalendarScreen({ householdId }: Props) {
  const today = toIsoDate(new Date());
  const [selected, setSelected] = useState(today);
  const [shown, setShown] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [swedishDays, setSwedishDays] = useState<Map<string, SwedishDay>>(new Map());

  // Your events, live
  useEffect(() => {
    function fetchEvents() {
      supabase
        .from("events")
        .select("*")
        .eq("household_id", householdId)
        .order("date")
        .order("time")
        .then(({ data }) => setEvents(data ?? []));
    }

    fetchEvents();
    const channel = supabase
      .channel(`events:${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => fetchEvents(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  useEffect(() => {
    supabase
      .from("members")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data }) => setMembers(data ?? []));
  }, [householdId]);

  // Name days for the shown month, and for today and tomorrow (the banner)
  useEffect(() => {
    const now = fromIsoDate(today);
    const tomorrow = fromIsoDate(addDays(today, 1));
    const wanted = [
      [shown.year, shown.month],
      [now.getFullYear(), now.getMonth() + 1],
      [tomorrow.getFullYear(), tomorrow.getMonth() + 1],
    ];
    Promise.all(wanted.map(([y, m]) => fetchSwedishMonth(y, m))).then((months) => {
      setSwedishDays(new Map(months.flat().map((day) => [day.date, day])));
    });
  }, [shown, today]);

  function changeMonth(step: -1 | 1) {
    const date = new Date(shown.year, shown.month - 1 + step, 1);
    setShown({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }

  // One colored dot per event, in the color of the person it belongs to
  const people = toPeople(members);
  const eventColors = new Map<string, string[]>();
  for (const event of events) {
    const color = people.find((p) => p.id === event.assigned_to)?.color ?? EVERYONE.color;
    eventColors.set(event.date, [...(eventColors.get(event.date) ?? []), color]);
  }

  const todayInfo = swedishDays.get(today);
  const tomorrowInfo = swedishDays.get(addDays(today, 1));

  return (
    <>
      <section className="calendar-hero">
        <div>
          <span className="week-label">Vecka</span>
          <span className="week-number">{isoWeek(new Date())}</span>
        </div>
        <p className="today-label">{longDate(today)}</p>
      </section>

      {todayInfo && (todayInfo.nameDays.length > 0 || todayInfo.holiday) && (
        <div className="nameday-banner">
          {todayInfo.holiday && (
            <p className="nameday-today">Idag är det {todayInfo.holiday}!</p>
          )}
          {todayInfo.nameDays.length > 0 && (
            <p className="nameday-today">
              Idag har {joinNames(todayInfo.nameDays)} namnsdag! 🎉
            </p>
          )}
          {tomorrowInfo && tomorrowInfo.nameDays.length > 0 && (
            <p className="nameday-tomorrow">
              Imorgon: {joinNames(tomorrowInfo.nameDays)}
            </p>
          )}
        </div>
      )}

      <MonthGrid
        year={shown.year}
        month={shown.month}
        today={today}
        selected={selected}
        swedishDays={swedishDays}
        eventColors={eventColors}
        onSelect={setSelected}
        onChangeMonth={changeMonth}
      />
    </>
  );
}
