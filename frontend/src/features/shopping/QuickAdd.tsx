import { useCallback, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLiveReload } from "../../lib/useLiveReload";
import { CATEGORIES, sectionFor, toneStyle } from "./options";
import { parseQuickAdd } from "./parse";
import { memoryKey, suggest, type Memory } from "./suggest";
import type { Item } from "./types";

type Props = {
  householdId: string;
  onAdded: (item: Item) => void;
};

function formatAmount(amount: number) {
  return String(amount).replace(".", ",");
}

export default function QuickAdd({ householdId, onAdded }: Props) {
  const [text, setText] = useState("");
  // undefined = use the suggestion, null = no category
  const [pickedCategory, setPickedCategory] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [memory, setMemory] = useState<Map<string, Memory>>(new Map());

  // How this household usually buys things, learned by a database trigger
  const loadMemory = useCallback(() => {
    supabase
      .from("item_memory")
      .select("*")
      .eq("household_id", householdId)
      .then(({ data }) => setMemory(new Map((data ?? []).map((m) => [memoryKey(m.name_key), m]))));
  }, [householdId]);

  useLiveReload("item_memory", householdId, loadMemory);

  const suggestion = suggest(parseQuickAdd(text), memory);
  const category = pickedCategory === undefined ? suggestion.category : pickedCategory;
  const typing = suggestion.name.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!typing || saving) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        household_id: householdId,
        name: suggestion.name,
        amount: suggestion.amount,
        unit: suggestion.unit,
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
    loadMemory(); // the trigger just learned from this item
    setText("");
    setPickedCategory(undefined);
  }

  return (
    <div className="quick-add">
      {typing && (
        <>
          <p className="quick-add-preview" aria-live="polite">
            Läggs till: {formatAmount(suggestion.amount)} {suggestion.unit} {suggestion.name}
            {suggestion.remembered && <span className="quick-add-remembered"> · som vanligt</span>}
          </p>
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
        </>
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
