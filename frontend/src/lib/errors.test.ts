import { afterEach, describe, expect, it, vi } from "vitest";
import { friendlyError } from "./errors";

describe("friendlyError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows our own database messages as they are", () => {
    const error = { code: "P0001", message: "Tiden kan inte vara i framtiden" };
    expect(friendlyError(error)).toBe("Tiden kan inte vara i framtiden");
  });

  it("translates English database messages", () => {
    const error = { code: "P0001", message: "Invalid invite code" };
    expect(friendlyError(error)).toMatch(/Fel inbjudningskod/);
  });

  it("hides unexpected technical errors behind a plain message", () => {
    const error = { code: "42501", message: "permission denied for table shopping_items" };
    expect(friendlyError(error)).toBe("Något gick fel. Försök igen.");
    expect(friendlyError(error, "Kunde inte spara.")).toBe("Kunde inte spara.");
  });

  it("says when the phone is offline", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(/Ingen internetanslutning/);
  });
});
