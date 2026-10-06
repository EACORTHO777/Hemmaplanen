import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Props = {
  householdId: string;
  onOpenHousehold: () => void;
};

export default function HouseholdInfo({ householdId, onOpenHousehold }: Props) {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("households")
      .select("name, invite_code")
      .eq("id", householdId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setName(data.name);
        setInviteCode(data.invite_code);
      });
  }, [householdId]);

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="app-header">
      <p className="eyebrow">{name}</p>
      <div className="header-actions">
      {inviteCode && (
        <button
          type="button"
          className="invite-chip"
          onClick={copyCode}
          aria-label={`Inbjudningskod ${inviteCode}. Tryck för att kopiera.`}
        >
          {copied ? "Kopierad!" : `Kod ${inviteCode}`}
        </button>
      )}
      <button
        type="button"
        className="icon-button"
        onClick={onOpenHousehold}
        aria-label="Hushållets medlemmar"
      >
        <Users size={20} aria-hidden />
      </button>
      </div>
    </header>
  );
}
