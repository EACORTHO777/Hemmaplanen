import type { Database } from "../../types/database";

type Item = Database["public"]["Tables"]["shopping_items"]["Row"];

type Props = {
  item: Item;
  onToggle: (item: Item) => void;
};

export default function ItemRow({ item, onToggle }: Props) {
  return (
    <li key={item.id}>
      <label>
        <input
          type="checkbox"
          checked={item.done}
          onChange={() => onToggle(item)}
        />
        {item.name}
        {item.amount && (
          <span>
            {" "}
            · {item.amount} {item.unit}
          </span>
        )}
      </label>
    </li>
  );
}
