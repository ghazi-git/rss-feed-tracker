import { createSignal } from "solid-js";

const [uiTheme, setUITheme] = createSignal(getStoredTheme());
export { uiTheme };

function getStoredTheme(): UITheme | null {
  const theme = localStorage.getItem("ui-theme");
  if (theme === "light" || theme === "dark") {
    return theme;
  } else {
    return null;
  }
}

export function setAndEnableTheme(theme: string | null) {
  if (theme === "light" || theme === "dark") {
    setUITheme(theme);
    localStorage.setItem("ui-theme", theme);
    enableTheme(theme);
  } else {
    setUITheme(null);
    localStorage.removeItem("ui-theme");
    enableTheme(detectSystemTheme());
  }
}

export function enableTheme(theme: string) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
}

export function detectSystemTheme(): UITheme {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDark ? "dark" : "light";
}

type UITheme = "light" | "dark";
