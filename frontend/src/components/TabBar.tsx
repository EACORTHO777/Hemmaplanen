import { Calendar, ListChecks, Pill, ShoppingCart } from "lucide-react";

export type Tab = "shopping" | "calendar" | "todos" | "medicine";

const TABS = [
  { id: "shopping", label: "Shopping", Icon: ShoppingCart },
  { id: "calendar", label: "Calendar", Icon: Calendar },
  { id: "todos", label: "To-dos", Icon: ListChecks },
  { id: "medicine", label: "Medicine", Icon: Pill },
] as const;

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

export default function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tab-bar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={id === active ? "tab active" : "tab"}
          aria-current={id === active ? "page" : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={22} aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
