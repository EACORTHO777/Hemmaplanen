import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";
import AddItemForm from "./AddItemForm";
import ItemRow from "./ItemRow";
import { SECTIONS } from "./options";
import "./shopping.css";

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

  const active = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const known = SECTIONS.flatMap((s) => s.categories);
  const other = active.filter((i) => !known.includes(i.category ?? ""));

  return (
    <div>
      <AddItemForm
        householdId={householdId}
        onAdded={(item) => setItems([...items, item])}
      />
      {SECTIONS.map((section) => {
        const list = active.filter((i) =>
          section.categories.includes(i.category ?? ""),
        );
        if (list.length === 0) return null;
        return (
          <section key={section.title} className="section-card">
            <h3>{section.title}</h3>
            <ul>
              {list.map((item) => (
                <ItemRow key={item.id} item={item} onToggle={toggleItem} />
              ))}
            </ul>
          </section>
        );
      })}

      {other.length > 0 && (
        <section className="section-card">
          <h3>Övrigt</h3>
          <ul>
            {other.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggleItem} />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="section-card">
          <h3>Klar</h3>
          <ul>
            {done.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggleItem} />
            ))}
          </ul>
          <button onClick={clearDone}>Clear checked</button>
        </section>
      )}
    </div>
  );
}
