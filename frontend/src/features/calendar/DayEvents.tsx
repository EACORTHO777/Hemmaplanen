import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { SwedishDay } from "../../lib/swedishDays";
import type { Database } from "../../types/database";
import { EVERYONE, type Person } from "../household/people";
import { toneStyle } from "../shopping/options";
import { longDate } from "./dates";
import { showError } from "../../lib/toast";

type CalendarEvent = Database["public"]["Tables"]["events"]["Row"];

type Props = {
  date: string;
  events: CalendarEvent[];
  people: Person[];
  info: SwedishDay | undefined;
  onChanged: () => void;
};

export default function DayEvents({ date, events, people, info, onChanged }: Props) {
  async function removeEvent(event: CalendarEvent) {
    if (!confirm(`Ta bort "${event.title}"?`)) return;
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      showError(error, "Kunde inte ta bort händelsen.");
      return;
    }
    onChanged();
  }

  const details = [info?.holiday, info?.nameDays.length ? `Namnsdag: ${info.nameDays.join(", ")}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="section-card tone day-panel" style={toneStyle(EVERYONE.color)}>
      <div className="day-panel-head">
        <h2>{longDate(date)}</h2>
        {details && <p className="day-details">{details}</p>}
      </div>

      {events.length === 0 ? (
        <p className="day-empty">Inget inplanerat.</p>
      ) : (
        <ul className="item-list">
          {events.map((event) => {
            const person = people.find((p) => p.id === event.assigned_to) ?? EVERYONE;
            return (
              <li key={event.id} className="event-row">
                <span className="event-time">
                  {event.time ? event.time.slice(0, 5) : "Heldag"}
                </span>
                <span className="item-name">{event.title}</span>
                <span className="item-qty tone" style={toneStyle(person.color)}>
                  {person.name}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Ta bort ${event.title}`}
                  onClick={() => removeEvent(event)}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
