import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";
import { toPeople } from "../household/people";
import { toneStyle } from "../shopping/options";
import MedicineCard from "./MedicineCard";
import { MEDICINES, medicineName, type Medicine } from "./medicines";
import "./medicine.css";

type Log = Database["public"]["Tables"]["medicine_logs"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

type Props = {
  householdId: string;
};

function dateTime(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function MedicineScreen({ householdId }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [personId, setPersonId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick every second so the countdown stays live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    supabase
      .from("members")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data }) => setMembers(data ?? []));
  }, [householdId]);

  useEffect(() => {
    function fetchLogs() {
      supabase
        .from("medicine_logs")
        .select("*")
        .eq("household_id", householdId)
        .order("given_at", { ascending: false })
        .limit(200)
        .then(({ data }) => setLogs(data ?? []));
    }

    fetchLogs();
    const channel = supabase
      .channel(`medicine_logs:${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medicine_logs" },
        () => fetchLogs(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  const people = toPeople(members);
  // Default to the first person without a login (usually a child)
  const defaultPerson = members.find((m) => m.user_id === null) ?? members[0];
  const activeId = personId ?? defaultPerson?.id ?? null;
  const person = people.find((p) => p.id === activeId);
  const personLogs = logs.filter((log) => log.given_to === activeId);

  function nameOfUser(userId: string | null) {
    return members.find((m) => m.user_id === userId)?.display_name ?? null;
  }

  async function give(medicine: Medicine, givenAt?: Date) {
    if (!person?.id) return;
    const when = givenAt
      ? ` kl ${givenAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`
      : "";
    if (!confirm(`Är du säker på att du gav ${medicine.name} till ${person.name}${when}?`)) return;

    const { error } = await supabase.from("medicine_logs").insert({
      household_id: householdId,
      medicine: medicine.id,
      given_to: person.id,
      // Leaving it out lets the database use now()
      given_at: givenAt?.toISOString(),
    });
    // The database refuses doses closer than 4 hours, even if the button was enabled
    if (error) alert(error.message);
  }

  async function changeTime(log: Log, givenAt: Date) {
    const { error } = await supabase
      .from("medicine_logs")
      .update({ given_at: givenAt.toISOString() })
      .eq("id", log.id);
    if (error) alert(error.message);
  }

  async function removeLog(log: Log) {
    if (!confirm(`Ta bort ${medicineName(log.medicine)} ${dateTime(log.given_at)}?`)) return;
    const { error } = await supabase.from("medicine_logs").delete().eq("id", log.id);
    if (error) alert(error.message);
  }

  return (
    <>
      <section className="shopping-summary">
        <div>
          <h1 className="page-title">Medicin</h1>
          <p className="summary-text">Följ alltid doseringen på förpackningen.</p>
        </div>
      </section>

      {people.length > 1 && (
        <div className="filter-chips" role="group" aria-label="Vem gäller det?">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip tone"
              style={toneStyle(p.color)}
              aria-pressed={p.id === activeId}
              onClick={() => setPersonId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {person &&
        MEDICINES.map((medicine) => {
          const last = personLogs.find((log) => log.medicine === medicine.id);
          return (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              personName={person.name}
              lastGivenAt={last?.given_at ?? null}
              lastGivenBy={last ? nameOfUser(last.given_by) : null}
              now={now}
              onGive={(givenAt) => give(medicine, givenAt)}
              onChangeTime={(givenAt) => last && changeTime(last, givenAt)}
            />
          );
        })}

      {personLogs.length > 0 && (
        <section className="medicine-history">
          <h2>Historik</h2>
          <ul>
            {personLogs.slice(0, 20).map((log) => (
              <li key={log.id} className="history-row">
                <span className="history-when">{dateTime(log.given_at)}</span>
                <span className="history-what">
                  {medicineName(log.medicine)}
                  {nameOfUser(log.given_by) && (
                    <span className="history-by"> · gav: {nameOfUser(log.given_by)}</span>
                  )}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Ta bort ${medicineName(log.medicine)} ${dateTime(log.given_at)}`}
                  onClick={() => removeLog(log)}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
