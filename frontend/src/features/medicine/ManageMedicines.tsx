import { useState, type FormEvent } from "react";
import { Pencil, Settings2, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Person } from "../household/people";
import { toneStyle } from "../shopping/options";
import { formatInterval, MEDICINE_COLORS, type Medicine } from "./medicines";
import { showError } from "../../lib/toast";

type Props = {
  householdId: string;
  medicines: Medicine[];
  people: Person[];
  selectedPersonId: string | null;
  onRemove: (medicine: Medicine) => void;
  onChanged: () => void;
};

// Adding, editing and removing medicines lives here, away from the "Ge" buttons,
// so a medicine can't be removed by mistake while giving a dose.
export default function ManageMedicines({
  householdId,
  medicines,
  people,
  selectedPersonId,
  onRemove,
  onChanged,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(MEDICINE_COLORS[0]);
  const [hours, setHours] = useState("4");
  // Who the medicine is for: a member's id, or null for everyone
  const [memberId, setMemberId] = useState<string | null>(selectedPersonId);
  // null = adding a new medicine, otherwise the one being edited
  const [editing, setEditing] = useState<Medicine | null>(null);

  function resetForm() {
    setEditing(null);
    setName("");
    setColor(MEDICINE_COLORS[0]);
    setHours("4");
    setMemberId(selectedPersonId);
  }

  function startEdit(medicine: Medicine) {
    setEditing(medicine);
    setName(medicine.name);
    setColor(medicine.color);
    setHours(String(medicine.min_interval_minutes / 60).replace(".", ","));
    setMemberId(medicine.member_id);
  }

  function ownerName(id: string | null) {
    return id === null ? "alla" : (people.find((p) => p.id === id)?.name ?? "okänd");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = {
      name: name.trim(),
      color: color.toUpperCase(),
      min_interval_minutes: Math.round(Number(hours.replace(",", ".")) * 60),
      member_id: memberId,
    };
    const { error } = editing
      ? await supabase.from("medicines").update(values).eq("id", editing.id)
      : await supabase.from("medicines").insert({ household_id: householdId, ...values });
    if (error) {
      showError(error, "Kunde inte spara medicinen.");
      return;
    }
    onChanged();
    resetForm();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="add-medicine-toggle"
        onClick={() => {
          setMemberId(selectedPersonId);
          setOpen(true);
        }}
      >
        <Settings2 size={20} aria-hidden />
        Hantera mediciner
      </button>
    );
  }

  return (
    <section className="form-card add-medicine">
      <div className="manage-head">
        <h2>Hantera mediciner</h2>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            resetForm();
            setOpen(false);
          }}
        >
          Klar
        </button>
      </div>

      <ul className="manage-list">
        {medicines.map((medicine) => (
          <li key={medicine.id} className="manage-row">
            <span className="manage-dot" style={{ background: medicine.color }} aria-hidden="true" />
            <span className="manage-name">{medicine.name}</span>
            <span className="manage-interval">
              {ownerName(medicine.member_id)} · var {formatInterval(medicine.min_interval_minutes)}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label={`Ändra ${medicine.name}`}
              onClick={() => startEdit(medicine)}
            >
              <Pencil size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={`Ta bort ${medicine.name}`}
              onClick={() => onRemove(medicine)}
            >
              <Trash2 size={18} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <form className="add-medicine-form" onSubmit={handleSubmit}>
        <h3>{editing ? `Ändra ${editing.name}` : "Ny medicin"}</h3>

        <label htmlFor="medicine-name">Namn</label>
        <input
          id="medicine-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="t.ex. Nezeril"
          maxLength={40}
          required
        />

        <fieldset className="color-field">
          <legend>För vem?</legend>
          <div className="owner-chips">
            <button
              type="button"
              className="chip chip-small chip-all"
              aria-pressed={memberId === null}
              onClick={() => setMemberId(null)}
            >
              Alla
            </button>
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                className="chip chip-small tone"
                style={toneStyle(person.color)}
                aria-pressed={memberId === person.id}
                onClick={() => setMemberId(person.id)}
              >
                {person.name}
              </button>
            ))}
          </div>
        </fieldset>

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

        <label htmlFor="medicine-hours">Minsta tid mellan doser (timmar)</label>
        <input
          id="medicine-hours"
          inputMode="decimal"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          pattern="[0-9]+([.,][0-9]+)?"
          required
        />

        <button type="submit" className="primary-button">
          {editing ? "Spara ändringar" : "Lägg till"}
        </button>
        {editing && (
          <button type="button" className="text-button" onClick={resetForm}>
            Avbryt
          </button>
        )}
      </form>
    </section>
  );
}
