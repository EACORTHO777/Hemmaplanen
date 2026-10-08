import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import LoginScreen from "./features/auth/LoginScreen";
import Onboarding from "./features/household/Onboarding";
import HouseholdInfo from "./features/household/HouseholdInfo";
import ShoppingList from "./features/shopping/ShoppingList";
import TabBar, { type Tab } from "./components/TabBar";
import TodoList from "./features/todos/TodoList";
import CalendarScreen from "./features/calendar/CalendarScreen";
import MedicineScreen from "./features/medicine/MedicineScreen";
import HouseholdScreen from "./features/household/HouseholdScreen";
import { showError } from "./lib/toast";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  // undefined = still loading, null = user has no household yet
  const [householdId, setHouseholdId] = useState<string | null | undefined>(
    undefined,
  );
  const [tab, setTab] = useState<Tab>("shopping");
  const [showHousehold, setShowHousehold] = useState(false);
  const userId = session?.user.id;
  // Demo visitors sign in anonymously and get their own demo household
  const isDemo = session?.user.is_anonymous ?? false;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Look up the user's household after login (demo visitors get one created)
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("members")
      .select("household_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setHouseholdId(data.household_id);
        } else if (isDemo) {
          const { data: demoId, error } = await supabase.rpc("create_demo_household");
          if (error) showError(error);
          setHouseholdId(demoId ?? null);
        } else {
          setHouseholdId(null);
        }
      });
  }, [userId, isDemo]);

  function handleLogin() {
    supabase.auth.signInWithOAuth({ provider: "google" });
  }

  async function handleDemo() {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) showError(error, "Demon kunde inte starta just nu. Försök igen om en stund.");
  }

  function handleLogout() {
    supabase.auth.signOut();
    setHouseholdId(undefined);
  }

  if (!session) return <LoginScreen onLogin={handleLogin} onDemo={handleDemo} />;
  if (householdId === undefined) return <p className="loading">Laddar…</p>;
  if (householdId === null) return <Onboarding onReady={setHouseholdId} />;

  return (
    <div className="app">
      {isDemo && (
        <div className="demo-banner" role="status">
          <span>Du testar en demo. Allt raderas efter ett dygn.</span>
          <button type="button" className="text-button" onClick={handleLogout}>
            Avsluta
          </button>
        </div>
      )}
      <HouseholdInfo
        householdId={householdId}
        onOpenHousehold={() => setShowHousehold(true)}
      />
      <main>
        {showHousehold ? (
          <HouseholdScreen
            householdId={householdId}
            userId={session.user.id}
            isDemo={isDemo}
            onBack={() => setShowHousehold(false)}
            onLeft={() => {
              setShowHousehold(false);
              setHouseholdId(null);
            }}
          />
        ) : (
          <>
            {tab === "shopping" && <ShoppingList householdId={householdId} />}
            {tab === "todos" && <TodoList householdId={householdId} />}
            {tab === "calendar" && <CalendarScreen householdId={householdId} />}
            {tab === "medicine" && <MedicineScreen householdId={householdId} />}
          </>
        )}
      </main>
      <button
        type="button"
        className="text-button logout"
        onClick={handleLogout}
      >
        {isDemo ? "Avsluta demo" : "Logga ut"}
      </button>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
