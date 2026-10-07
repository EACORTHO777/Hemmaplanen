import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ItemRow from "./ItemRow";
import type { Item } from "./types";

const milk: Item = {
  id: "1",
  household_id: "h1",
  name: "Mjölk",
  amount: 2,
  unit: "st",
  category: "Mejeri",
  done: false,
  created_at: "2026-10-07T08:00:00Z",
};

describe("ItemRow", () => {
  it("shows the name and amount", () => {
    render(<ItemRow item={milk} onToggle={() => {}} />);
    expect(screen.getByText("Mjölk")).toBeInTheDocument();
    expect(screen.getByText("2 st")).toBeInTheDocument();
  });

  it("calls onToggle when the checkbox is clicked", async () => {
    const onToggle = vi.fn();
    render(<ItemRow item={milk} onToggle={onToggle} />);

    // The label makes the checkbox findable by the item's name, like a screen reader would
    await userEvent.click(screen.getByRole("checkbox", { name: /mjölk/i }));

    expect(onToggle).toHaveBeenCalledWith(milk);
  });

  it("is checked when the item is done", () => {
    render(<ItemRow item={{ ...milk, done: true }} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
