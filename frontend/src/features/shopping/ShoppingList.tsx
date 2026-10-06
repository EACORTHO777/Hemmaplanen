import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";
import AddItemForm from "./AddItemForm";

type Item = Database["public"]["Tables"]["shopping_items"]["Row"];

type Props = {
  householdId: string;
};

export default function ShoppingList({ householdId }: Props) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    supabase
      .from("shopping_items")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data }) => setItems(data ?? []));
  }, [householdId]);

  async function toggleItem(item: Item) {
    const { error } = await supabase
      .from("shopping_items")
      .update({ done: !item.done })
      .eq("id", item.id);
    if (error) {
      alert(error.message);
      return;
    }
    setItems(
      items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
    );
  }

  return (
    <div>
      <AddItemForm
        householdId={householdId}
        onAdded={(item) => setItems([...items, item])}
      />
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item)}
              />
              {item.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
