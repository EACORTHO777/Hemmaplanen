import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { CATEGORIES, guessCategory, sectionFor, toneStyle } from "./options";
import { parseQuickAdd } from "./parse";
import type { Item } from "./types";

type Props = {
  householdId: string;
  onAdded: (item: Item) => void;
};

export default function QuickAdd({ householdId, onAdded }: Props) {
  const [text, setText] = useState("");
  // undefined = use the automatic guess, null = no category
  const [pickedCategory, setPickedCategory] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const parsed = parseQuickAdd(text);
  const category =
    pickedCategory === undefined ? guessCategory(parsed.name) : pickedCategory;
  const typing = parsed.name.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!typing || saving) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        household_id: householdId,
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
        category,
      })
      .select()
      .single();
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }
    onAdded(data);
    setText("");
    setPickedCategory(undefined);
  }

  return (
    <div className="quick-add">
      {typing && (
        <div className="category-picker" role="group" aria-label="Kategori">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="chip chip-small tone"
              style={toneStyle(sectionFor(c).color)}
              aria-pressed={c === category}
              onClick={() => setPickedCategory(c === category ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <form className="quick-add-bar" onSubmit={handleSubmit}>
        <label htmlFor="quick-add-input" className="visually-hidden">
          Lägg till vara
        </label>
        <input
          id="quick-add-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Lägg till vara… t.ex. 2 mjölk"
          autoComplete="off"
          enterKeyHint="done"
        />
        <button
          type="submit"
          className="quick-add-button"
          aria-label="Lägg till"
          disabled={!typing || saving}
        >
          <Plus size={22} aria-hidden />
        </button>
      </form>
    </div>
  );
}
