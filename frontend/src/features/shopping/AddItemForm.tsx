import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

type Item = Database["public"]["Tables"]["shopping_items"]["Row"];

type Props = {
  householdId: string;
  onAdded: (item: Item) => void;
};

export default function AddItemForm({ householdId, onAdded }: Props) {
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({ household_id: householdId, name: name })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    onAdded(data);
    setName("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add item"
      />
      <button type="submit">Add</button>
    </form>
  );
}
