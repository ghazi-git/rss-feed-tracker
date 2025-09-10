import { createSignal } from "solid-js";

export const [uiTheme, setUITheme] = createSignal(getStoredTheme());

export function getStoredTheme() {
  const theme = localStorage.getItem("ui-theme");
  if (theme === "light" || theme === "dark") {
    return theme;
  } else {
    return null;
  }
}

export function storeTheme(theme) {
  if (theme === "light" || theme === "dark") {
    localStorage.setItem("ui-theme", theme);
  } else {
    localStorage.removeItem("ui-theme");
  }
}

export function enableTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
}

export function detectSystemTheme() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDark ? "dark" : "light";
}
