import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

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

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
