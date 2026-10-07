import { useEffect } from "react";
import { supabase } from "./supabase";

// Keeps a household's rows fresh by calling `load`:
// - right away
// - when any device changes the table (Supabase realtime)
// - when the app comes back to the foreground or back online, because phones
//   often pause the realtime connection while an installed app is in the background
// Screens also call `load` themselves after their own changes, so they never
// depend on realtime to show what the user just did.
// `load` must be stable (wrap it in useCallback).
export function useLiveReload(table: string, householdId: string, load: () => void) {
  useEffect(() => {
    load();

    const channel = supabase
      .channel(`${table}:${householdId}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => load())
      .subscribe();

    function reloadWhenVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", reloadWhenVisible);
    window.addEventListener("online", reloadWhenVisible);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", reloadWhenVisible);
      window.removeEventListener("online", reloadWhenVisible);
    };
  }, [table, householdId, load]);
}
