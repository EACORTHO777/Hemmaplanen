import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Props = {
  householdId: string;
  onOpenHousehold: () => void;
};

export default function HouseholdInfo({ householdId, onOpenHousehold }: Props) {
  const [name, setName] = useState("");

  useEffect(() => {
    supabase
      .from("households")
      .select("name")
      .eq("id", householdId)
      .single()
      .then(({ data }) => {
        if (data) setName(data.name);
      });
  }, [householdId]);

  return (
    <header className="app-header">
      <button
        type="button"
        className="household-avatar"
        onClick={onOpenHousehold}
        aria-label={`Hushållet ${name}. Visa medlemmar och inbjudningskod.`}
      >
        {name.charAt(0)}
      </button>
    </header>
  );
}
