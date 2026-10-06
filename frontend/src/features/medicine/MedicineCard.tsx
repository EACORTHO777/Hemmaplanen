import { useState, type FormEvent } from "react";
import { toneStyle } from "../shopping/options";
import { formatInterval, type Medicine } from "./medicines";

const MINUTE = 60 * 1000;

type Props = {
  medicine: Medicine;
  personName: string;
  doseTimes: string[]; // all doses of this medicine for this person, newest first
  lastGivenBy: string | null;
  now: number;
  onGive: (givenAt: Date) => void;
  onChangeTime: (givenAt: Date) => void;
};

// Same levels as the old app: 4 h minimum, 6 h "should give", 8 h "give now",
// scaled to each medicine's own minimum interval (1×, 1.5×, 2×).
// The minimum is also enforced by the database trigger.
function statusFor(elapsed: number | null, interval: number) {
  if (elapsed === null) return { text: "Ingen dos registrerad", canGive: true, level: "ok" };
  if (elapsed < interval) return { text: "Vänta", canGive: false, level: "wait" };
  if (elapsed < interval * 1.5) return { text: "Du kan ge nu", canGive: true, level: "ok" };
  if (elapsed < interval * 2) return { text: "Du bör ge nu", canGive: true, level: "should" };
  return { text: "GE NU!", canGive: true, level: "now" };
}

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

// "idag 17:12", "igår 23:50" or "mån 5 okt 08:00"
function dayAndTime(ms: number, now: number) {
  const day = new Date(ms).toDateString();
  if (day === new Date(now).toDateString()) return `idag ${clock(ms)}`;
  if (day === new Date(now - 24 * 60 * MINUTE).toDateString()) return `igår ${clock(ms)}`;
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
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
  doseTimes,
  lastGivenBy,
  now,
  onGive,
  onChangeTime,
}: Props) {
  // "give" = confirm a new dose (time can be adjusted), "edit" = fix the latest dose's time
  const [mode, setMode] = useState<"idle" | "give" | "edit">("idle");
  const [time, setTime] = useState("");

  const doses = doseTimes.map((iso) => new Date(iso).getTime());
  const lastMs = doses[0] ?? null;
  const elapsed = lastMs === null ? null : now - lastMs;
  const interval = medicine.min_interval_minutes * MINUTE;
  const status = statusFor(elapsed, interval);
  const progress = elapsed === null ? 1 : Math.min(elapsed / (interval * 2), 1);
  const inputId = `${medicine.id}-time`;

  // The next step on the way to "GE NU!"
  let nextStep: { text: string; at: number } | null = null;
  if (lastMs !== null && elapsed !== null) {
    if (elapsed < interval) nextStep = { text: "Kan ges", at: lastMs + interval };
    else if (elapsed < interval * 1.5) nextStep = { text: "Bör ges", at: lastMs + interval * 1.5 };
    else if (elapsed < interval * 2) nextStep = { text: "Ge senast", at: lastMs + interval * 2 };
  }

  // The time that will be saved, from the time field
  function chosenTime(): Date {
    if (mode === "edit" && lastMs !== null) return atTime(new Date(lastMs), time);
    if (time === clock(now)) return new Date(now);
    const givenAt = atTime(new Date(now), time);
    // A time later than now means it was given yesterday evening
    if (givenAt.getTime() > now) givenAt.setDate(givenAt.getDate() - 1);
    return givenAt;
  }

  function open(nextMode: "give" | "edit") {
    setMode(nextMode);
    setTime(clock(nextMode === "edit" && lastMs !== null ? lastMs : now));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const givenAt = chosenTime();
    // When editing, the dose being moved doesn't count against itself
    const others = mode === "edit" ? doses.slice(1) : doses;
    const clash = others.find((dose) => Math.abs(dose - givenAt.getTime()) < interval);
    if (clash !== undefined) {
      alert(
        `För tidigt: ${medicine.name} gavs ${dayAndTime(clash, now)}. ` +
          `Det ska gå minst ${formatInterval(medicine.min_interval_minutes)} mellan doserna, ` +
          `så tidigast ${dayAndTime(clash + interval, now)}.`,
      );
      return;
    }
    if (mode === "edit") onChangeTime(givenAt);
    else onGive(givenAt);
    setMode("idle");
  }

  return (
    <section className="section-card tone medicine-card" style={toneStyle(medicine.color)}>
      <div className="section-head">
        <h2>{medicine.name}</h2>
        <span className="section-left">
          {personName} · var {formatInterval(medicine.min_interval_minutes)}
        </span>
      </div>

      <div className="medicine-body">
        <p className={`medicine-status ${status.level}`} aria-live="polite">
          {status.text}
        </p>

        <div
          className="medicine-progress"
          role="progressbar"
          aria-label={`Tid sedan senaste ${medicine.name}, upp till ${formatInterval(
            medicine.min_interval_minutes * 2,
          )}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span className="medicine-progress-fill" style={{ width: `${progress * 100}%` }} />
          <span className="medicine-progress-mark" style={{ left: "50%" }} aria-hidden="true" />
          <span className="medicine-progress-mark" style={{ left: "75%" }} aria-hidden="true" />
        </div>
        <div className="medicine-scale" aria-hidden="true">
          <span>0</span>
          <span style={{ left: "50%" }}>{formatInterval(medicine.min_interval_minutes)}</span>
          <span style={{ left: "75%" }}>{formatInterval(medicine.min_interval_minutes * 1.5)}</span>
          <span style={{ left: "100%" }}>{formatInterval(medicine.min_interval_minutes * 2)}</span>
        </div>

        {lastMs !== null && (
          <>
            {nextStep && (
              <p className="medicine-next">
                {nextStep.text} kl {clock(nextStep.at)} ({countdown(nextStep.at - now)})
              </p>
            )}
            <p className="medicine-last">
              Senast given {dayAndTime(lastMs, now)}
              {lastGivenBy && ` av ${lastGivenBy}`}
              {mode === "idle" && (
                <>
                  {" · "}
                  <button type="button" className="text-button" onClick={() => open("edit")}>
                    Ändra tid
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {mode === "idle" ? (
          <button
            type="button"
            className="primary-button medicine-give"
            disabled={!status.canGive}
            onClick={() => open("give")}
          >
            Ge {medicine.name}
          </button>
        ) : (
          <form className="time-form" onSubmit={handleSubmit}>
            <label htmlFor={inputId}>
              {mode === "edit"
                ? "Ändra tiden för senaste dosen"
                : `Ge ${medicine.name} till ${personName}`}
            </label>
            <div className="time-form-row">
              <input
                id={inputId}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
              <button type="submit" className="primary-button medicine-confirm">
                {mode === "edit" ? "Spara" : "Bekräfta"}
              </button>
            </div>
            {time && (
              <p className="time-preview">Sparas som: {dayAndTime(chosenTime().getTime(), now)}</p>
            )}
            <button type="button" className="text-button" onClick={() => setMode("idle")}>
              Avbryt
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
