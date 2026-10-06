import type { Item } from "./types";

type Props = {
  item: Item;
  onToggle: (item: Item) => void;
};

function formatAmount(amount: number) {
  return String(amount).replace(".", ",");
}

export default function ItemRow({ item, onToggle }: Props) {
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
    </li>
  );
}
