import { useState, type FormEvent } from "react";
import { toneStyle } from "../shopping/options";
import type { Medicine } from "./medicines";

const HOUR = 60 * 60 * 1000;
const MIN_INTERVAL = 4 * HOUR; // also enforced by the database trigger
const NORMAL_INTERVAL = 6 * HOUR;

type Props = {
  medicine: Medicine;
  personName: string;
  lastGivenAt: string | null; // ISO timestamp
  lastGivenBy: string | null;
  now: number;
  onGive: (givenAt?: Date) => void;
  onChangeTime: (givenAt: Date) => void;
};

// Same thresholds and wording as the old Alvedon app
function statusFor(elapsed: number | null) {
  if (elapsed === null) return { text: "Ingen dos registrerad", canGive: true };
  if (elapsed < MIN_INTERVAL) return { text: "Vänta", canGive: false };
  if (elapsed < 5 * HOUR) return { text: "Du kan ge nu", canGive: true };
  if (elapsed < NORMAL_INTERVAL) return { text: "Inga problem att ge nu", canGive: true };
  return { text: "Ge nu", canGive: true };
}

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// "13:15" on the same day as `base`
function atTime(base: Date, hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date(base);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function MedicineCard({
  medicine,
  personName,
  lastGivenAt,
  lastGivenBy,
  now,
  onGive,
  onChangeTime,
}: Props) {
  // "give" = log a dose at another time, "edit" = fix the latest dose's time
  const [mode, setMode] = useState<"idle" | "give" | "edit">("idle");
  const [time, setTime] = useState("");

  const lastMs = lastGivenAt ? new Date(lastGivenAt).getTime() : null;
  const elapsed = lastMs === null ? null : now - lastMs;
  const status = statusFor(elapsed);
  const progress = elapsed === null ? 1 : Math.min(elapsed / NORMAL_INTERVAL, 1);
  const inputId = `${medicine.id}-time`;

  function open(nextMode: "give" | "edit") {
    setMode(nextMode);
    setTime(clock(nextMode === "edit" && lastMs !== null ? lastMs : now));
  }

  function handleTimeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "edit" && lastGivenAt) {
      onChangeTime(atTime(new Date(lastGivenAt), time));
    } else {
      // A time later than now means it was given yesterday evening
      const givenAt = atTime(new Date(now), time);
      if (givenAt.getTime() > now) givenAt.setDate(givenAt.getDate() - 1);
      onGive(givenAt);
    }
    setMode("idle");
  }

  return (
    <section className="section-card tone medicine-card" style={toneStyle(medicine.color)}>
      <div className="section-head">
        <h2>{medicine.name}</h2>
        <span className="section-left">{personName}</span>
      </div>

      <div className="medicine-body">
        <p className={status.canGive ? "medicine-status" : "medicine-status wait"} aria-live="polite">
          {status.text}
        </p>

        <div
          className="medicine-progress"
          role="progressbar"
          aria-label={`Tid sedan senaste ${medicine.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span style={{ width: `${progress * 100}%` }} />
        </div>

        {lastMs !== null && (
          <>
            {elapsed !== null && elapsed < NORMAL_INTERVAL && (
              <p className="medicine-next">
                Nästa dos kl {clock(lastMs + NORMAL_INTERVAL)} ({countdown(NORMAL_INTERVAL - elapsed)})
              </p>
            )}
            <p className="medicine-last">
              Senast given kl {clock(lastMs)}
              {lastGivenBy && ` av ${lastGivenBy}`}
              {" · "}
              <button type="button" className="text-button" onClick={() => open("edit")}>
                Ändra tid
              </button>
            </p>
          </>
        )}

        {mode !== "idle" && (
          <form className="time-form" onSubmit={handleTimeSubmit}>
            <label htmlFor={inputId}>
              {mode === "edit" ? "Rätt tid för senaste dosen" : `När gav du ${medicine.name}?`}
            </label>
            <div className="time-form-row">
              <input
                id={inputId}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
              <button type="submit" className="secondary-button">
                Spara
              </button>
              <button type="button" className="text-button" onClick={() => setMode("idle")}>
                Avbryt
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          className="primary-button medicine-give"
          disabled={!status.canGive}
          onClick={() => onGive()}
        >
          Ge {medicine.name}
        </button>
        {mode === "idle" && (
          <button type="button" className="text-button other-time" onClick={() => open("give")}>
            Gav vid annan tid
          </button>
        )}
      </div>
    </section>
  );
}
