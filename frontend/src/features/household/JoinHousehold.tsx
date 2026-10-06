import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type Props = {
  onJoined: (householdId: string) => void;
};

export default function JoinHousehold({ onJoined }: Props) {
  const [code, setCode] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await supabase.rpc("join_household", {
      code: code.trim().toLowerCase(),
    });
    if (error) {
      alert(error.message);
      return;
    }
    onJoined(data);
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <label htmlFor="invite-code">Inbjudningskod</label>
      <input
        id="invite-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="t.ex. bef19c18"
        autoCapitalize="off"
        autoComplete="off"
        required
      />
      <button type="submit" className="secondary-button">
        Gå med
      </button>
    </form>
  );
}
