import type { Database } from "../../types/database";

type Item = Database["public"]["Tables"]["shopping_items"]["Row"];

type Props = {
  item: Item;
  onToggle: (item: Item) => void;
};

export default function ItemRow({ item, onToggle }: Props) {
  return (
    <li className={item.done ? "item-row done" : "item-row"}>
      <label>
        <input
          type="checkbox"
          checked={item.done}
          onChange={() => onToggle(item)}
        />
        <span className="item-name">{item.name}</span>
        {item.amount && (
          <span className="item-amount">
            {item.amount} {item.unit}
          </span>
        )}
      </label>
    </li>
  );
}
