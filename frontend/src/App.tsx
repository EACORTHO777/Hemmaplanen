import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import LoginScreen from "./features/auth/LoginScreen";
import Onboarding from "./features/household/Onboarding";
import HouseholdInfo from "./features/household/HouseholdInfo";
import ShoppingList from "./features/shopping/ShoppingList";
import TabBar, { type Tab } from "./components/TabBar";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  // undefined = still loading, null = user has no household yet
  const [householdId, setHouseholdId] = useState<string | null | undefined>(
    undefined,
  );
  const [tab, setTab] = useState<Tab>("shopping");
  const userId = session?.user.id;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Look up the user's household after login
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("members")
      .select("household_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setHouseholdId(data?.household_id ?? null));
  }, [userId]);

  function handleLogin() {
    supabase.auth.signInWithOAuth({ provider: "google" });
  }

  function handleLogout() {
    supabase.auth.signOut();
    setHouseholdId(undefined);
  }

  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (householdId === undefined) return <p className="loading">Laddar…</p>;
  if (householdId === null) return <Onboarding onReady={setHouseholdId} />;

  return (
    <div className="app">
      <HouseholdInfo householdId={householdId} />
      <main>
        {tab === "shopping" ? (
          <ShoppingList householdId={householdId} />
        ) : (
          <p className="coming-soon">Kommer snart</p>
        )}
      </main>
      <button
        type="button"
        className="text-button logout"
        onClick={handleLogout}
      >
        Logga ut
      </button>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
