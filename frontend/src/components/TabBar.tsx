import { Calendar, ListChecks, Pill, ShoppingCart } from "lucide-react";

export type Tab = "shopping" | "calendar" | "todos" | "medicine";

const TABS = [
  { id: "shopping", label: "Handla", Icon: ShoppingCart },
  { id: "calendar", label: "Kalender", Icon: Calendar },
  { id: "todos", label: "Att göra", Icon: ListChecks },
  { id: "medicine", label: "Medicin", Icon: Pill },
] as const;

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

export default function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tab-bar" aria-label="Huvudmeny">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={id === active ? "tab active" : "tab"}
          aria-current={id === active ? "page" : undefined}
          onClick={() => onChange(id)}
        >
          <span className="tab-icon">
            <Icon size={20} aria-hidden />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
