import { useCallback, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLiveReload } from "../../lib/useLiveReload";
import type { Database } from "../../types/database";
import { toneStyle } from "../shopping/options";
import { MEDICINE_COLORS } from "./medicines";

// Remaining, today and yesterday come from the inhaler_overview view in the database
type Overview = Database["public"]["Views"]["inhaler_overview"]["Row"];

type Props = {
  householdId: string;
  personId: string;
  personName: string;
};

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function puffs(n: number) {
  return `${n} ${n === 1 ? "puff" : "puffar"}`;
}

export default function Inhalers({ householdId, personId, personName }: Props) {
  const [inhalers, setInhalers] = useState<Overview[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Overview | "new" | null>(null);

  const load = useCallback(() => {
    supabase
      .from("inhaler_overview")
      .select("*")
      .eq("household_id", householdId)
      .order("name")
      .then(({ data }) => setInhalers(data ?? []));
  }, [householdId]);

  useLiveReload("inhalers", householdId, load);
  useLiveReload("inhaler_puffs", householdId, load);

  const mine = inhalers.filter((i) => i.member_id === personId);

  async function run(id: string, action: () => PromiseLike<{ error: unknown }>) {
    setBusy(id);
    const { error } = await action();
    setBusy(null);
    if (error) alert(error instanceof Error ? error.message : "Något gick fel");
    load();
  }

  function puff(inhaler: Overview) {
    run(inhaler.id!, () =>
      supabase.from("inhaler_puffs").insert({ household_id: householdId, inhaler_id: inhaler.id! }),
    );
  }

  async function undo(inhaler: Overview) {
    if (!inhaler.last_puff_at) return;
    if (!confirm(`Ångra puffen kl ${clock(inhaler.last_puff_at)}?`)) return;
    const { data } = await supabase
      .from("inhaler_puffs")
      .select("id")
      .eq("inhaler_id", inhaler.id!)
      .order("given_at", { ascending: false })
      .limit(1)
      .single();
    if (data) run(inhaler.id!, () => supabase.from("inhaler_puffs").delete().eq("id", data.id));
  }

  function replace(inhaler: Overview) {
    if (!confirm(`Ny ${inhaler.name}? Räknaren börjar om på ${inhaler.capacity} puffar.`)) return;
    run(inhaler.id!, () =>
      supabase
        .from("inhalers")
        .update({ remaining_at_start: inhaler.capacity!, started_at: new Date().toISOString() })
        .eq("id", inhaler.id!),
    );
  }

  return (
    <section className="inhalers" aria-label={`Inhalatorer för ${personName}`}>
      {mine.length > 0 && <h2 className="inhalers-heading">Inhalatorer</h2>}

      {mine.map((inhaler) => {
        const remaining = inhaler.remaining ?? 0;
        const capacity = inhaler.capacity ?? 120;
        const low = remaining <= (inhaler.warn_at ?? 20);
        return (
          <article
            key={inhaler.id}
            className="section-card tone inhaler-card"
            style={toneStyle(inhaler.color ?? "#C3D8F0")}
          >
            <div className="section-head">
              <h3>{inhaler.name}</h3>
              <span className="section-left">{personName}</span>
            </div>

            <div className="medicine-body">
              <p className={low ? "inhaler-left low" : "inhaler-left"} aria-live="polite">
                <span className="inhaler-count">{remaining}</span> puffar kvar
              </p>
              <div
                className="medicine-progress"
                role="progressbar"
                aria-label={`${remaining} av ${capacity} puffar kvar`}
                aria-valuemin={0}
                aria-valuemax={capacity}
                aria-valuenow={remaining}
              >
                <span
                  className={low ? "medicine-progress-fill low" : "medicine-progress-fill"}
                  style={{ width: `${(remaining / capacity) * 100}%` }}
                />
              </div>
              {low && (
                <p className="inhaler-warning">
                  {remaining === 0 ? "Inhalatorn är tom." : "Snart slut."} Dags att byta till en ny.
                </p>
              )}

              <p className="inhaler-days">
                Idag: <strong>{puffs(inhaler.today ?? 0)}</strong> · Igår: {puffs(inhaler.yesterday ?? 0)}
                {inhaler.last_puff_at && ` · Senast ${clock(inhaler.last_puff_at)}`}
              </p>

              <button
                type="button"
                className="primary-button medicine-give"
                disabled={busy === inhaler.id || remaining === 0}
                onClick={() => puff(inhaler)}
              >
                +1 puff
              </button>

              <div className="inhaler-actions">
                <button
                  type="button"
                  className="text-button"
                  disabled={!inhaler.last_puff_at}
                  onClick={() => undo(inhaler)}
                >
                  Ångra senaste
                </button>
                <button type="button" className="text-button" onClick={() => replace(inhaler)}>
                  Ny inhalator
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Ändra ${inhaler.name}`}
                  onClick={() => setEditing(inhaler)}
                >
                  <Pencil size={18} aria-hidden />
                </button>
              </div>
            </div>
          </article>
        );
      })}

      {editing ? (
        <InhalerForm
          householdId={householdId}
          personId={personId}
          personName={personName}
          inhaler={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      ) : (
        <button type="button" className="add-medicine-toggle" onClick={() => setEditing("new")}>
          <Plus size={20} aria-hidden />
          Lägg till inhalator för {personName}
        </button>
      )}
    </section>
  );
}

type FormProps = {
  householdId: string;
  personId: string;
  personName: string;
  inhaler: Overview | null; // null = new
  onDone: () => void;
};

function InhalerForm({ householdId, personId, personName, inhaler, onDone }: FormProps) {
  const [name, setName] = useState(inhaler?.name ?? "");
  const [color, setColor] = useState(inhaler?.color ?? MEDICINE_COLORS[0]);
  const [capacity, setCapacity] = useState(String(inhaler?.capacity ?? 120));
  const [remaining, setRemaining] = useState(String(inhaler?.remaining ?? 120));
  const [warnAt, setWarnAt] = useState(String(inhaler?.warn_at ?? 20));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = {
      name: name.trim(),
      color: color.toUpperCase(),
      capacity: Number(capacity),
      warn_at: Number(warnAt),
    };
    // A changed "puffar kvar nu" restarts the count from that number
    const restart =
      inhaler === null || Number(remaining) !== inhaler.remaining
        ? { remaining_at_start: Number(remaining), started_at: new Date().toISOString() }
        : {};

    const { error } = inhaler
      ? await supabase.from("inhalers").update({ ...values, ...restart }).eq("id", inhaler.id!)
      : await supabase
          .from("inhalers")
          .insert({ household_id: householdId, member_id: personId, ...values, ...restart });
    if (error) {
      alert(error.message);
      return;
    }
    onDone();
  }

  async function remove() {
    if (!inhaler) return;
    if (!confirm(`Ta bort ${inhaler.name}? Alla puffar i historiken försvinner också.`)) return;
    const { error } = await supabase.from("inhalers").delete().eq("id", inhaler.id!);
    if (error) {
      alert(error.message);
      return;
    }
    onDone();
  }

  return (
    <form className="form-card add-medicine add-medicine-form" onSubmit={handleSubmit}>
      <h3>{inhaler ? `Ändra ${inhaler.name}` : `Ny inhalator för ${personName}`}</h3>

      <label htmlFor="inhaler-name">Namn</label>
      <input
        id="inhaler-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="t.ex. Blå"
        maxLength={40}
        required
      />

      <fieldset className="color-field">
        <legend>Färg</legend>
        <div className="color-swatches">
          {MEDICINE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="color-swatch"
              style={{ background: c }}
              aria-label={`Färg ${c}`}
              aria-pressed={color.toUpperCase() === c}
              onClick={() => setColor(c)}
            />
          ))}
          <label className="color-custom">
            <span className="visually-hidden">Egen färg</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <label htmlFor="inhaler-remaining">Puffar kvar nu</label>
      <input
        id="inhaler-remaining"
        type="number"
        inputMode="numeric"
        min={0}
        max={1000}
        value={remaining}
        onChange={(e) => setRemaining(e.target.value)}
        required
      />

      <label htmlFor="inhaler-capacity">Puffar i en ny inhalator</label>
      <input
        id="inhaler-capacity"
        type="number"
        inputMode="numeric"
        min={1}
        max={1000}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        required
      />

      <label htmlFor="inhaler-warn">Varna när det är så här många kvar</label>
      <input
        id="inhaler-warn"
        type="number"
        inputMode="numeric"
        min={0}
        max={1000}
        value={warnAt}
        onChange={(e) => setWarnAt(e.target.value)}
        required
      />

      <button type="submit" className="primary-button">
        {inhaler ? "Spara" : "Lägg till"}
      </button>
      <div className="inhaler-actions">
        <button type="button" className="text-button" onClick={onDone}>
          Avbryt
        </button>
        {inhaler && (
          <button type="button" className="text-button danger" onClick={remove}>
            <Trash2 size={16} aria-hidden /> Ta bort inhalator
          </button>
        )}
      </div>
    </form>
  );
}
