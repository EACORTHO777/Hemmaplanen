import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toneStyle } from "../shopping/options";
import type { Database } from "../../types/database";
import AddTodo from "./AddTodo";
import { EVERYONE, toPeople } from "../household/people";

type Todo = Database["public"]["Tables"]["todos"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

type Props = {
  householdId: string;
};

export default function TodoList({ householdId }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("members")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data }) => setMembers(data ?? []));
  }, [householdId]);

  useEffect(() => {
    function fetchTodos() {
      supabase
        .from("todos")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at")
        .then(({ data }) => setTodos(data ?? []));
    }

    fetchTodos();
    const channel = supabase
      .channel(`todos:${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => fetchTodos(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  async function toggleTodo(todo: Todo) {
    const { error } = await supabase
      .from("todos")
      .update({ done: !todo.done })
      .eq("id", todo.id);
    if (error) {
      alert(error.message);
      return;
    }
    setTodos(
      todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
    );
  }

  async function clearDone() {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("household_id", householdId)
      .eq("done", true);
    if (error) {
      alert(error.message);
      return;
    }
    setTodos(todos.filter((t) => !t.done));
  }

  const people = toPeople(members);
  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  // One card per person, plus "Alla" for to-dos assigned to nobody
  const groups = [...people, EVERYONE]
    .map((person) => {
      const mine = todos.filter((t) => t.assigned_to === person.id);
      const mineOpen = mine.filter((t) => !t.done);
      const mineDone = mine.filter((t) => t.done);
      return {
        person,
        todos: [...mineOpen, ...mineDone],
        left: mineOpen.length,
      };
    })
    .filter((group) => group.todos.length > 0);

  const activeFilter = groups.some((g) => g.person.name === filter)
    ? filter
    : null;
  const visibleGroups = activeFilter
    ? groups.filter((g) => g.person.name === activeFilter)
    : groups;

  return (
    <>
      <section className="shopping-summary">
        <div>
          <h1 className="page-title">Att göra</h1>
          <p className="summary-text">{open.length} kvar</p>
          {done.length > 0 && (
            <button type="button" className="text-button" onClick={clearDone}>
              Rensa klara ({done.length})
            </button>
          )}
        </div>
      </section>
      {groups.length > 1 && (
        <div className="filter-chips" role="group" aria-label="Visa person">
          <button
            type="button"
            className="chip chip-all"
            aria-pressed={activeFilter === null}
            onClick={() => setFilter(null)}
          >
            Alla {todos.length}
          </button>
          {groups.map((g) => (
            <button
              key={g.person.name}
              type="button"
              className="chip tone"
              style={toneStyle(g.person.color)}
              aria-pressed={activeFilter === g.person.name}
              onClick={() =>
                setFilter(activeFilter === g.person.name ? null : g.person.name)
              }
            >
              {g.person.name} {g.left}
            </button>
          ))}
        </div>
      )}

      {todos.length === 0 && (
        <p className="empty-state">Inget att göra just nu. 🎉</p>
      )}

      {visibleGroups.map((g) => (
        <section
          key={g.person.name}
          className="section-card tone"
          style={toneStyle(g.person.color)}
        >
          <div className="section-head">
            <h2>{g.person.name}</h2>
            <span className="section-left">
              {g.left > 0 ? `${g.left} kvar` : "Klart"}
            </span>
          </div>
          <ul className="item-list">
            {g.todos.map((todo) => (
              <li
                key={todo.id}
                className={todo.done ? "item-row done" : "item-row"}
              >
                <label>
                  <input
                    type="checkbox"
                    className="item-check"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo)}
                  />
                  <span className="item-name">{todo.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <AddTodo householdId={householdId} people={people} />
    </>
  );
}
