import { createSignal } from "solid-js";

export const [uiTheme, setUITheme] = createSignal(getStoredTheme());

export function getStoredTheme(): UITheme | null {
  const theme = localStorage.getItem("ui-theme");
  if (theme === "light" || theme === "dark") {
    return theme;
  } else {
    return null;
  }
}

export function storeTheme(theme: UITheme | null) {
  if (theme === "light" || theme === "dark") {
    localStorage.setItem("ui-theme", theme);
  } else {
    localStorage.removeItem("ui-theme");
  }
}

export function enableTheme(theme: UITheme | null) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
}

export function detectSystemTheme(): UITheme {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDark ? "dark" : "light";
}

type UITheme = "light" | "dark";
