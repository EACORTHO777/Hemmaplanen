import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";
import { CATEGORIES, UNITS } from "./options";

type Item = Database["public"]["Tables"]["shopping_items"]["Row"];

type Props = {
  householdId: string;
  onAdded: (item: Item) => void;
};

export default function AddItemForm({ householdId, onAdded }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("st");
  const [category, setCategory] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        household_id: householdId,
        name: name,
        amount: amount ? Number(amount) : null,
        unit: unit,
        category: category || null,
      })

      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    onAdded(data);
    setName("");
    setAmount("");
  }

  return (
    <form onSubmit={handleSubmit} className="section-card add-form">
      <input
        className="add-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add item"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <select value={unit} onChange={(e) => setUnit(e.target.value)}>
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Category</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button type="submit">Add</button>
    </form>
  );
}
