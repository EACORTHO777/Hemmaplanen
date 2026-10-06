import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Props = {
  householdId: string;
};

export default function HouseholdInfo({ householdId }: Props) {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

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

  return (
    <div>
      <h1>{name}</h1>
      <p>Invite code: {inviteCode}</p>
    </div>
  );
}
