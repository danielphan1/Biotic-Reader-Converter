"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

// Light/dark switch. The stored choice is applied before first paint by the
// bootstrap script in app/layout.tsx; this control only reads and writes it.
// Until mount we render the button in a neutral state (no icon commitment), so
// server HTML and client HTML agree regardless of the visitor's OS setting.

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const pinned = document.documentElement.dataset.theme;
  if (pinned === "light" || pinned === "dark") return pinned;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next: Theme = (theme ?? currentTheme()) === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("biotic-theme", next);
    } catch {
      // Private mode / blocked storage: the theme still applies for this visit.
    }
    setTheme(next);
  }

  const goingLight = theme !== "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === null
          ? "Switch theme"
          : goingLight
            ? "Switch to light theme"
            : "Switch to dark theme"
      }
      className="inline-flex size-9 items-center justify-center rounded-full border border-border-hairline bg-surface text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
