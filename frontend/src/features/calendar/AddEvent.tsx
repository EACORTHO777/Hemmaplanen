import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { EVERYONE, type Person } from "../household/people";
import { toneStyle } from "../shopping/options";
import { fromIsoDate } from "./dates";

type Props = {
  householdId: string;
  date: string;
  people: Person[];
  onAdded: () => void;
};

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(fromIsoDate(iso));
}

export default function AddEvent({ householdId, date, people, onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  // null = shared by everyone
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  const typing = title.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!typing) return;
    const { error } = await supabase.from("events").insert({
      household_id: householdId,
      title: title.trim(),
      date,
      time: time || null,
      assigned_to: assignedTo,
    });
    if (error) {
      alert(error.message);
      return;
    }
    onAdded();
    setTitle("");
    setTime("");
  }

  return (
    <div className="quick-add">
      {typing && (
        <div className="category-picker" role="group" aria-label="När och vem?">
          <label className="time-chip">
            <span className="visually-hidden">Tid (valfri)</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          {[EVERYONE, ...people].map((person) => (
            <button
              key={person.id ?? "everyone"}
              type="button"
              className="chip chip-small tone"
              style={toneStyle(person.color)}
              aria-pressed={assignedTo === person.id}
              onClick={() => setAssignedTo(person.id)}
            >
              {person.name}
            </button>
          ))}
        </div>
      )}
      <form className="quick-add-bar" onSubmit={handleSubmit}>
        <label htmlFor="event-input" className="visually-hidden">
          Ny händelse
        </label>
        <input
          id="event-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Lägg till ${shortDate(date)}…`}
          autoComplete="off"
          enterKeyHint="done"
        />
        <button
          type="submit"
          className="quick-add-button"
          aria-label="Lägg till"
          disabled={!typing}
        >
          <Plus size={22} aria-hidden />
        </button>
      </form>
    </div>
  );
}
