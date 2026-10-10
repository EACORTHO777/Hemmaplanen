import { useState } from "react";
import type { Item } from "./types";
import { CATEGORIES } from "./options";

type Props = {
  item: Item;
  onSave: (changes: Partial<Item>) => void;
  onCancel: () => void;
};

export default function Edititem({ item, onSave, onCancel }: Props) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? "");

  return (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name: name.trim(), category: category || null });
      }}
    >
      <label htmlFor="edit-name">Namn</label>
      <input
        id="edit-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <label htmlFor="edit-category">Kategori</label>
      <select
        id="edit-category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Övrigt</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button type="submit" className="primary-button">
        Spara
      </button>
      <button type="button" className="text-button" onClick={onCancel}>
        Avbryt
      </button>
    </form>
  );
}
