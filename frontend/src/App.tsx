import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import CreateHousehold from "./features/household/CreateHousehold"; // NEW
import JoinHousehold from "./features/household/JoinHousehold";
import HouseholdInfo from "./features/household/HouseholdInfo";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [householdId, setHouseholdId] = useState<string | null | undefined>(
    undefined,
  ); // NEW
  const userId = session?.user.id; // NEW

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // NEW: look up the user's household after login
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
    setHouseholdId(undefined); // NEW
  }

  if (!session) {
    return <button onClick={handleLogin}>Log in with Google</button>;
  }

  if (householdId === undefined) return <p>Loading…</p>; // NEW
  if (householdId === null) {
    return (
      <div>
        <CreateHousehold onCreated={setHouseholdId} />
        <p>or</p>
        <JoinHousehold onJoined={setHouseholdId} />
      </div>
    );
  }

  return (
    <div>
      <p>Logged in as {session.user.email}</p>
      <HouseholdInfo householdId={householdId} />
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}
