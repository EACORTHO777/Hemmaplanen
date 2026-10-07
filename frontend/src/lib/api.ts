import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

// Calls the Hemmaplanen backend with the user's login token.
// The app works without the backend; only notifications depend on it.
export async function callApi(path: string, body?: unknown): Promise<Response | null> {
  if (!API_URL) return null;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;

  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// Fire and forget: a sleeping or unreachable backend must never block the app
export function notifyInBackground(path: string, body?: unknown) {
  callApi(path, body).catch((error) => console.warn("Notification not sent", error));
}
