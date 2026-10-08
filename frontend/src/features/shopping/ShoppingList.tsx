import { useCallback, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLiveReload } from "../../lib/useLiveReload";
import ItemRow from "./ItemRow";
import ProgressRing from "./ProgressRing";
import QuickAdd from "./QuickAdd";
import { OTHER_SECTION, SECTIONS, sectionFor, toneStyle } from "./options";
import type { Item } from "./types";
import "./shopping.css";
import LoadState, { type Status } from "../../components/LoadState";
import { showError } from "../../lib/toast";

type Props = {
  householdId: string;
};

export default function ShoppingList({ householdId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [filter, setFilter] = useState<string | null>(null);

  const fetchItems = useCallback(() => {
    supabase
      .from("shopping_items")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) {
          setStatus((s) => (s === "ready" ? "ready" : "error"));
          return;
        }
        setItems(data);
        setStatus("ready");
      });
  }, [householdId]);

  useLiveReload("shopping_items", householdId, fetchItems);

  async function toggleItem(item: Item) {
    const { error } = await supabase
      .from("shopping_items")
      .update({ done: !item.done })
      .eq("id", item.id);
    if (error) {
      showError(error);
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
      showError(error);
      return;
    }
    setItems(items.filter((i) => !i.done));
  }

  function addItem(item: Item) {
    setItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev : [...prev, item],
    );
  }

  const doneCount = items.filter((i) => i.done).length;
  const remaining = items.length - doneCount;

  // Group items by store section, unchecked items first
  const groups = [...SECTIONS, OTHER_SECTION]
    .map((section) => {
      const inSection = items.filter((i) => sectionFor(i.category) === section);
      const open = inSection.filter((i) => !i.done);
      const done = inSection.filter((i) => i.done);
      return {
        section,
        items: [...open, ...done],
        left: open.length,
        done: done.length,
      };
    })
    .filter((group) => group.items.length > 0);

  const activeFilter = groups.some((g) => g.section.title === filter)
    ? filter
    : null;
  const visibleGroups = activeFilter
    ? groups.filter((g) => g.section.title === activeFilter)
    : groups;
  const segments = groups
    .filter((g) => g.done > 0)
    .map((g) => ({ color: g.section.color, count: g.done }));
  if (status !== "ready") {
    return (
      <LoadState
        status={status}
        onRetry={() => {
          setStatus("loading");
          fetchItems();
        }}
      />
    );
  }

  return (
    <>
      <section className="shopping-summary" aria-label="Översikt">
        <ProgressRing
          segments={segments}
          total={items.length}
          remaining={remaining}
        />
        <div>
          <h1 className="page-title">Handla</h1>
          <p className="summary-text">
            {doneCount} av {items.length} i korgen
          </p>
          {doneCount > 0 && (
            <button type="button" className="text-button" onClick={clearDone}>
              Rensa klara ({doneCount})
            </button>
          )}
        </div>
      </section>

      {groups.length > 1 && (
        <div className="filter-chips" role="group" aria-label="Visa avdelning">
          <button
            type="button"
            className="chip chip-all"
            aria-pressed={activeFilter === null}
            onClick={() => setFilter(null)}
          >
            Alla {items.length}
          </button>
          {groups.map((g) => (
            <button
              key={g.section.title}
              type="button"
              className="chip tone"
              style={toneStyle(g.section.color)}
              aria-pressed={activeFilter === g.section.title}
              onClick={() =>
                setFilter(
                  activeFilter === g.section.title ? null : g.section.title,
                )
              }
            >
              {g.section.short} {g.items.length}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="empty-state">
          Listan är tom. Skriv i fältet längst ner för att lägga till något.
        </p>
      )}

      {visibleGroups.map((g) => (
        <section
          key={g.section.title}
          className="section-card tone"
          style={toneStyle(g.section.color)}
        >
          <div className="section-head">
            <h2>{g.section.title}</h2>
            <span className="section-left">
              {g.left > 0 ? `${g.left} kvar` : "Klart"}
            </span>
          </div>
          <ul className="item-list">
            {g.items.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggleItem} />
            ))}
          </ul>
        </section>
      ))}

      <QuickAdd householdId={householdId} onAdded={addItem} />
    </>
  );
}
