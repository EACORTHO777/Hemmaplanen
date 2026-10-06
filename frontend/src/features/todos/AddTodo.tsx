import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

type Member = Database["public"]["Tables"]["members"]["Row"];

type Props = {
  householdId: string;
  members: Member[];
};

export default function AddTodo({ householdId, members }: Props) {
  const [title, setTitle] = useState("");
  // null = everyone
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
            Alla
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              className="chip chip-all"
              aria-pressed={assignedTo === m.id}
              onClick={() => setAssignedTo(m.id)}
            >
              {m.display_name.split(" ")[0]}
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
