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
    function fetchItems() {
      supabase
        .from("shopping_items")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at")
        .then(({ data }) => setItems(data ?? []));
    }

    fetchItems();
    const channel = supabase
      .channel(`shopping_items:${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items" },
        () => fetchItems(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  async function clearDone() {
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("household_id", householdId)
      .eq("done", true);
    if (error) {
      alert(error.message);
      return;
    }
    setItems(items.filter((i) => !i.done));
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
              {item.amount && (
                <span>
                  {" "}
                  · {item.amount} {item.unit}
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={clearDone}>Clear checked</button>
    </div>
  );
}
