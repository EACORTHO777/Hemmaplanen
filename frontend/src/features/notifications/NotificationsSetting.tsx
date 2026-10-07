import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { callApi } from "../../lib/api";
import { currentPushState, turnOffPush, turnOnPush, type PushState } from "./push";

type Props = {
  householdId: string;
};

const HINTS: Partial<Record<PushState, string>> = {
  "needs-install": "Lägg till appen på hemskärmen (Dela → Lägg till på hemskärmen) för att få aviseringar.",
  unsupported: "Den här webbläsaren kan inte ta emot aviseringar.",
  denied: "Aviseringar är blockerade. Tillåt dem i telefonens inställningar för Hemmaplanen.",
};

export default function NotificationsSetting({ householdId }: Props) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    currentPushState().then(setState);
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      setState(state === "on" ? await turnOffPush() : await turnOnPush(householdId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Kunde inte ändra aviseringar");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setTestResult("Skickar… (första gången kan ta upp till en minut)");
    try {
      const response = await callApi("/notifications/test");
      if (!response?.ok) {
        setTestResult("Kunde inte nå servern. Försök igen om en minut.");
        return;
      }
      const { delivered } = (await response.json()) as { delivered: number };
      setTestResult(
        delivered > 0
          ? `Skickad till ${delivered} ${delivered === 1 ? "enhet" : "enheter"}.`
          : "Ingen enhet tog emot den. Slå av och på aviseringar och försök igen.",
      );
    } catch {
      setTestResult("Kunde inte nå servern. Försök igen om en minut.");
    }
  }

  if (state === null) return null;
  const canToggle = state === "on" || state === "off";

  return (
    <section className="form-card settings-card">
      <button
        type="button"
        role="switch"
        aria-checked={state === "on"}
        className="setting-row"
        onClick={toggle}
        disabled={!canToggle || busy}
      >
        <Bell size={20} aria-hidden />
        <span className="setting-label">Aviseringar</span>
        <span className="switch" aria-hidden="true">
          <span className="switch-knob" />
        </span>
      </button>
      {HINTS[state] && <p className="setting-hint">{HINTS[state]}</p>}
      {state === "on" && (
        <button type="button" className="text-button setting-hint" onClick={sendTest}>
          Skicka en testnotis
        </button>
      )}
      {testResult && (
        <p className="setting-hint" aria-live="polite">
          {testResult}
        </p>
      )}
    </section>
  );
}
