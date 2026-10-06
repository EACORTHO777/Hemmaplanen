import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toneStyle } from "../shopping/options";
import type { Database } from "../../types/database";
import AddTodo from "./AddTodo";

type Todo = Database["public"]["Tables"]["todos"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

type Props = {
  householdId: string;
};

export default function TodoList({ householdId }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

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

  function firstName(memberId: string) {
    return members.find((m) => m.id === memberId)?.display_name.split("")[0];
  }

  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

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

      {todos.length === 0 ? (
        <p className="empty-state">Inget att göra just nu. 🎉</p>
      ) : (
        <section className="section-card tone" style={toneStyle("#EBDBD3")}>
          <ul className="item-list">
            {[...open, ...done].map((todo) => (
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
                  {todo.assigned_to && (
                    <span className="item-qty">
                      {firstName(todo.assigned_to)}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
      <AddTodo householdId={householdId} members={members} />
    </>
  );
}
