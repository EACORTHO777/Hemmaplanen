import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Props = {
  householdId: string;
};

export default function InviteCard({ householdId }: Props) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("households")
      .select("invite_code")
      .eq("id", householdId)
      .single()
      .then(({ data }) => {
        if (data) setCode(data.invite_code);
      });
  }, [householdId]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="form-card invite-card">
      <h2>Bjud in en vuxen</h2>
      <p className="invite-help">
        De loggar in med Google och skriver den här koden:
      </p>
      <button
        type="button"
        className="invite-code"
        onClick={copyCode}
        aria-label={`Inbjudningskod ${code}. Tryck för att kopiera.`}
      >
        <span>{code}</span>
        <Copy size={20} aria-hidden />
      </button>
      <p className="invite-help" aria-live="polite">
        {copied ? "Kopierad!" : "Tryck på koden för att kopiera"}
      </p>
    </section>
  );
}
