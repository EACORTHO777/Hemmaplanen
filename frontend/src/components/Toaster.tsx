import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { onToast } from "../lib/toast";

const VISIBLE_MS = 6000;

export default function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    onToast(setMessage);
    return () => onToast(null);
  }, []);

  // Hide by itself after a few seconds; a new message restarts the timer
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    // The live region is always in the page so screen readers announce new messages
    <div className="toaster" role="alert" aria-live="assertive">
      {message && (
        <div className="toast">
          <span>{message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Stäng"
            onClick={() => setMessage(null)}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
