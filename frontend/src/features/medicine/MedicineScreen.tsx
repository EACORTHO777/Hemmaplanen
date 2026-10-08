import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLiveReload } from "../../lib/useLiveReload";
import type { Database } from "../../types/database";
import { toPeople } from "../household/people";
import { toneStyle } from "../shopping/options";
import Inhalers from "./Inhalers";
import ManageMedicines from "./ManageMedicines";
import MedicineCard from "./MedicineCard";
import type { Medicine } from "./medicines";
import "./medicine.css";
import LoadState, { type Status } from "../../components/LoadState";
import { showError } from "../../lib/toast";

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
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicinesStatus, setMedicinesStatus] = useState<Status>("loading");
  const [logsStatus, setLogsStatus] = useState<Status>("loading");
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

  const fetchMedicines = useCallback(() => {
    supabase
      .from("medicines")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) {
          setMedicinesStatus((s) => (s === "ready" ? "ready" : "error"));
          return;
        }
        setMedicines(data);
        setMedicinesStatus("ready");
      });
  }, [householdId]);

  useLiveReload("medicines", householdId, fetchMedicines);

  const fetchLogs = useCallback(() => {
    supabase
      .from("medicine_logs")
      .select("*")
      .eq("household_id", householdId)
      .order("given_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) {
          setLogsStatus((s) => (s === "ready" ? "ready" : "error"));
          return;
        }
        setLogs(data);
        setLogsStatus("ready");
      });
  }, [householdId]);

  useLiveReload("medicine_logs", householdId, fetchLogs);

  const people = toPeople(members);
  // Default to the first person without a login (usually a child)
  const defaultPerson = members.find((m) => m.user_id === null) ?? members[0];
  const activeId = personId ?? defaultPerson?.id ?? null;
  const person = people.find((p) => p.id === activeId);
  const personLogs = logs.filter((log) => log.given_to === activeId);

  function medicineName(medicineId: string) {
    return medicines.find((m) => m.id === medicineId)?.name ?? "Borttagen medicin";
  }

  function nameOfUser(userId: string | null) {
    return members.find((m) => m.user_id === userId)?.display_name ?? null;
  }

  // The card already asked for confirmation and a time
  async function give(medicine: Medicine, givenAt: Date) {
    if (!person?.id) return;
    const { error } = await supabase.from("medicine_logs").insert({
      household_id: householdId,
      medicine_id: medicine.id,
      given_to: person.id,
      given_at: givenAt.toISOString(),
    });
    // The database refuses doses closer than the medicine allows
    if (error) {
      showError(error, "Kunde inte spara dosen.");
      return;
    }
    fetchLogs();
  }

  async function changeTime(log: Log, givenAt: Date) {
    const { error } = await supabase
      .from("medicine_logs")
      .update({ given_at: givenAt.toISOString() })
      .eq("id", log.id);
    if (error) {
      showError(error, "Kunde inte ändra tiden.");
      return;
    }
    fetchLogs();
  }

  async function removeMedicine(medicine: Medicine) {
    const question = `Ta bort ${medicine.name}? All historik för ${medicine.name} försvinner också.`;
    if (!confirm(question)) return;
    const { error } = await supabase.from("medicines").delete().eq("id", medicine.id);
    if (error) {
      showError(error, "Kunde inte ta bort medicinen.");
      return;
    }
    // Don't wait for realtime: remove the card and its history right away
    setMedicines((prev) => prev.filter((m) => m.id !== medicine.id));
    setLogs((prev) => prev.filter((log) => log.medicine_id !== medicine.id));
  }

  async function removeLog(log: Log) {
    if (!confirm(`Ta bort ${medicineName(log.medicine_id)} ${dateTime(log.given_at)}?`)) return;
    const { error } = await supabase.from("medicine_logs").delete().eq("id", log.id);
    if (error) {
      showError(error, "Kunde inte ta bort dosen.");
      return;
    }
    fetchLogs();
  }

  // Both medicines and their history are needed before the cards make sense
  const status: Status =
    medicinesStatus === "error" || logsStatus === "error"
      ? "error"
      : medicinesStatus === "loading" || logsStatus === "loading"
        ? "loading"
        : "ready";

  if (status !== "ready") {
    return (
      <LoadState
        status={status}
        onRetry={() => {
          setMedicinesStatus("loading");
          setLogsStatus("loading");
          fetchMedicines();
          fetchLogs();
        }}
      />
    );
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
        medicines
          // Shared medicines plus the ones that belong to the selected person
          .filter((medicine) => medicine.member_id === null || medicine.member_id === activeId)
          .map((medicine) => {
          const last = personLogs.find((log) => log.medicine_id === medicine.id);
          return (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              personName={person.name}
              doseTimes={personLogs
                .filter((log) => log.medicine_id === medicine.id)
                .map((log) => log.given_at)}
              lastGivenBy={last ? nameOfUser(last.given_by) : null}
              now={now}
              onGive={(givenAt) => give(medicine, givenAt)}
              onChangeTime={(givenAt) => last && changeTime(last, givenAt)}
            />
          );
        })}

      {person?.id && (
        <Inhalers householdId={householdId} personId={person.id} personName={person.name} />
      )}

      <ManageMedicines
        householdId={householdId}
        medicines={medicines}
        people={people}
        selectedPersonId={activeId}
        onChanged={fetchMedicines}
        onRemove={removeMedicine}
      />

      {personLogs.length > 0 && (
        <section className="medicine-history">
          <h2>Historik</h2>
          <ul>
            {personLogs.slice(0, 20).map((log) => (
              <li key={log.id} className="history-row">
                <span className="history-when">{dateTime(log.given_at)}</span>
                <span className="history-what">
                  {medicineName(log.medicine_id)}
                  {nameOfUser(log.given_by) && (
                    <span className="history-by"> · gav: {nameOfUser(log.given_by)}</span>
                  )}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Ta bort ${medicineName(log.medicine_id)} ${dateTime(log.given_at)}`}
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
