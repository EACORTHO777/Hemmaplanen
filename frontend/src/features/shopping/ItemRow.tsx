import type { Item } from "./types";
import { Pencil } from "lucide-react";

type Props = {
  item: Item;
  onToggle: (item: Item) => void;
  onEdit: (item: Item) => void;
};

function formatAmount(amount: number) {
  return String(amount).replace(".", ",");
}

export default function ItemRow({ item, onToggle, onEdit }: Props) {
  return (
    <li className={item.done ? "item-row done" : "item-row"}>
      <label>
        <input
          type="checkbox"
          className="item-check"
          checked={item.done}
          onChange={() => onToggle(item)}
        />
        <span className="item-name">{item.name}</span>
        {item.amount !== null && (
          <span className="item-qty">
            {formatAmount(item.amount)} {item.unit}
          </span>
        )}
      </label>
      <button
        type="button"
        className="icon-button"
        aria-label={`Ändra ${item.name}`}
        onClick={() => onEdit(item)}
      >
        <Pencil size={18} aria-hidden />
      </button>
    </li>
  );
}
