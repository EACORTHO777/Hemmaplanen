import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_COLORS: Record<Theme, string> = { light: "#f5f4f7", dark: "#0e0f11" };

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null; // e.g. private browsing
  }
}

// index.html already picked the theme before the first paint; this button switches it
// and remembers the choice. Until the user picks one, the phone's setting is followed.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    if (savedTheme()) return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    function followPhone(event: MediaQueryListEvent) {
      const next = event.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    }
    query.addEventListener("change", followPhone);
    return () => query.removeEventListener("change", followPhone);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved, but the switch still works for this visit
    }
  }

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Byt till ljust läge" : "Byt till mörkt läge"}
    >
      {theme === "dark" ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}
