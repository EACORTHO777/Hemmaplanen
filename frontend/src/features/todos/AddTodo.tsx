import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Person } from "../household/people";
import { toneStyle } from "../shopping/options";

type Props = {
  householdId: string;
  people: Person[];
  onAdded: () => void;
};

export default function AddTodo({ householdId, people, onAdded }: Props) {
  const [title, setTitle] = useState("");
  // null = shared by everyone
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    const { error } = await supabase.from("todos").insert({
      household_id: householdId,
      title: title.trim(),
      assigned_to: assignedTo,
    });
    if (error) {
      alert(error.message);
      return;
    }
    onAdded();
    setTitle("");
  }

  return (
    <div className="quick-add">
      {title.trim() && (
        <div
          className="category-picker"
          role="group"
          aria-label="Vem ska göra det?"
        >
          <button
            type="button"
            className="chip chip-all"
            aria-pressed={assignedTo === null}
            onClick={() => setAssignedTo(null)}
          >
            Gemensamt
          </button>
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip tone"
              style={toneStyle(p.color)}
              aria-pressed={assignedTo === p.id}
              onClick={() => setAssignedTo(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      <form className="quick-add-bar" onSubmit={handleSubmit}>
        <label htmlFor="todo-input" className="visually-hidden">
          Ny uppgift
        </label>
        <input
          id="todo-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ny uppgift…"
          autoComplete="off"
          enterKeyHint="done"
        />
        <button
          type="submit"
          className="quick-add-button"
          aria-label="Lägg till"
          disabled={!title.trim()}
        >
          <Plus size={22} aria-hidden />
        </button>
      </form>
    </div>
  );
}
