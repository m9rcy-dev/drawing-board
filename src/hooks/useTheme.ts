"use client";
import { useSyncExternalStore, useCallback } from "react";

// ─── Theme Store ───────────────────────────────────────────────────────────────
// useSyncExternalStore reads getServerSnapshot() during SSR + hydration ("dark"),
// then switches to getSnapshot() (actual localStorage) after hydration — no mismatch.

type Theme = "dark" | "light";
const STORAGE_KEY = "drawboard-theme";

// Custom event dispatched on theme change so all hook instances stay in sync.
const subscribe = (callback: () => void) => {
  window.addEventListener("theme-change", callback);
  return () => window.removeEventListener("theme-change", callback);
};

const getSnapshot = (): Theme =>
  (localStorage.getItem(STORAGE_KEY) as Theme) ?? "dark";

const getServerSnapshot = (): Theme => "dark";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTheme = () => {
  // React uses getServerSnapshot during SSR and hydration, getSnapshot afterwards.
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("theme-change"));
  }, []);

  return { theme, toggleTheme };
};
