import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SwedishDay } from "../../lib/swedishDays";
import { toneStyle } from "../shopping/options";
import { longDate, monthName, monthWeeks, toIsoDate, WEEKDAYS } from "./dates";

type Props = {
  year: number;
  month: number; // 1–12
  today: string;
  selected: string;
  swedishDays: Map<string, SwedishDay>;
  eventColors: Map<string, string[]>; // date → one color per event
  onSelect: (date: string) => void;
  onChangeMonth: (step: -1 | 1) => void;
};

export default function MonthGrid({
  year,
  month,
  today,
  selected,
  swedishDays,
  eventColors,
  onSelect,
  onChangeMonth,
}: Props) {
  const weeks = monthWeeks(year, month);

  return (
    <section className="month" aria-label="Kalender">
      <div className="month-head">
        <button
          type="button"
          className="icon-button"
          aria-label="Föregående månad"
          onClick={() => onChangeMonth(-1)}
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
        <h2 className="month-title">
          {monthName(year, month)} {year}
        </h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Nästa månad"
          onClick={() => onChangeMonth(1)}
        >
          <ChevronRight size={22} aria-hidden />
        </button>
      </div>

      <table className="month-grid">
        <thead>
          <tr>
            <th scope="col" className="week-col">
              <abbr title="Vecka">v.</abbr>
            </th>
            {WEEKDAYS.map((day) => (
              <th scope="col" key={day}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={toIsoDate(week.days[0])}>
              <th scope="row" className="week-col">
                {week.week}
              </th>
              {week.days.map((day, index) => {
                const iso = toIsoDate(day);
                const info = swedishDays.get(iso);
                const colors = eventColors.get(iso) ?? [];
                const classes = ["day"];
                if (day.getMonth() !== month - 1) classes.push("outside");
                if (index === 6 || info?.isRedDay) classes.push("red");
                if (iso === today) classes.push("today");

                const label = [
                  longDate(iso),
                  info?.holiday,
                  colors.length > 0 &&
                    `${colors.length} ${colors.length === 1 ? "händelse" : "händelser"}`,
                ]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <td key={iso}>
                    <button
                      type="button"
                      className={classes.join(" ")}
                      aria-pressed={iso === selected}
                      aria-label={label}
                      onClick={() => onSelect(iso)}
                    >
                      <span aria-hidden="true">{day.getDate()}</span>
                      <span className="day-dots" aria-hidden="true">
                        {colors.slice(0, 3).map((color, i) => (
                          <span key={i} className="day-dot tone" style={toneStyle(color)} />
                        ))}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
