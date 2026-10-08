import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import { showError } from "../../lib/toast";

type Props = {
  onCreated: (householdId: string) => void;
};

export default function CreateHousehold({ onCreated }: Props) {
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await supabase.rpc("create_household", {
      household_name: name,
    });
    if (error) {
      showError(error, "Kunde inte skapa hushållet.");
      return;
    }
    onCreated(data);
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <label htmlFor="household-name">Nytt hushåll</label>
      <input
        id="household-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="t.ex. Cancinos"
        required
      />
      <button type="submit" className="primary-button">
        Skapa hushåll
      </button>
    </form>
  );
}
