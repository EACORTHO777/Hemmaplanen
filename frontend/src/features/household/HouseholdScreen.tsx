import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";
import InviteCard from "./InviteCard";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationsSetting from "../notifications/NotificationsSetting";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { showError } from "../../lib/toast";
import LoadState, { type Status } from "../../components/LoadState";

type Member = Database["public"]["Tables"]["members"]["Row"];

type Props = {
  householdId: string;
  userId: string;
  onBack: () => void;
  onLeft: () => void;
  isDemo: boolean;
};

export default function HouseholdScreen({
  householdId,
  userId,
  onBack,
  onLeft,
  isDemo,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");
  const [householdName, setHouseholdName] = useState("");

  useEffect(() => {
    supabase
      .from("households")
      .select("name")
      .eq("id", householdId)
      .single()
      .then(({ data }) => {
        if (data) setHouseholdName(data.name);
      });
  }, [householdId]);

  const fetchMembers = useCallback(() => {
    supabase
      .from("members")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setMembers(data);
        setStatus("ready");
      });
  }, [householdId]);

  useEffect(fetchMembers, [fetchMembers]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await supabase
      .from("members")
      .insert({ household_id: householdId, display_name: name })
      .select()
      .single();
    if (error) {
      showError(error, "Kunde inte lägga till personen.");
      return;
    }
    setMembers([...members, data]);
    setName("");
  }

  async function renameMember(member: Member) {
    const newName = prompt("Nytt namn", member.display_name)?.trim();
    if (!newName || newName === member.display_name) return;

    const { error } = await supabase
      .from("members")
      .update({ display_name: newName })
      .eq("id", member.id);
    if (error) {
      showError(error, "Kunde inte byta namn.");
      return;
    }
    setMembers(
      members.map((m) =>
        m.id === member.id ? { ...m, display_name: newName } : m,
      ),
    );
  }

  async function removeMember(member: Member) {
    const isMe = member.user_id === userId;
    const question = isMe
      ? "Vill du lämna hushållet?"
      : `Ta bort ${member.display_name}?`;
    if (!confirm(question)) return;

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", member.id);
    if (error) {
      showError(error, "Kunde inte ta bort personen.");
      return;
    }
    if (isMe) {
      onLeft();
      return;
    }
    setMembers(members.filter((m) => m.id !== member.id));
  }

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeft size={20} aria-hidden />
        Tillbaka
      </button>
      <p className="eyebrow screen-eyebrow">Hushåll</p>
      <h1 className="page-title screen-title">{householdName}</h1>

      {/* Only the member list waits for data; settings and log out stay usable */}
      <LoadState
        status={status}
        onRetry={() => {
          setStatus("loading");
          fetchMembers();
        }}
      />
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.id} className="member-row">
            <span className="member-avatar" aria-hidden="true">
              {member.display_name.charAt(0)}
            </span>
            <span className="member-info">
              <span className="member-name">
                {member.display_name}
                {member.user_id === userId && " (du)"}
              </span>
              <span className="member-type">
                {member.user_id ? "Har inloggning" : "Utan inloggning"}
              </span>
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label={`Byt namn på ${member.display_name}`}
              onClick={() => renameMember(member)}
            >
              <Pencil size={18} aria-hidden />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label={`Ta bort ${member.display_name}`}
              onClick={() => removeMember(member)}
            >
              <Trash2 size={18} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {/* Demo households can't be joined, so there is no code to share */}
      {!isDemo && <InviteCard householdId={householdId} />}

      <form className="form-card" onSubmit={addMember}>
        <label htmlFor="member-name">Lägg till person utan inloggning</label>
        <input
          id="member-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="t.ex. Bella"
          required
        />
        <button type="submit" className="primary-button">
          Lägg till
        </button>
      </form>

      <h2 className="settings-heading">Inställningar</h2>
      <NotificationsSetting householdId={householdId} />
      <ThemeToggle />
    </>
  );
}
