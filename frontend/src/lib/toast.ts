import { friendlyError } from "./errors";

type Listener = (message: string) => void;

let listener: Listener | null = null;

// Called once by <Toaster />, which shows the messages
export function onToast(next: Listener | null) {
  listener = next;
}

// Shows a short error message at the top of the screen instead of alert()
export function showError(error: unknown, fallback?: string) {
  listener?.(friendlyError(error, fallback));
}
