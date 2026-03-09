import { onCleanup, onMount } from "solid-js";

export function handleFilterShortcut(onShortcutTriggered?: () => void) {
  const handleShortcut = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === "f" && !event.shiftKey) {
      // avoid the find popup appearing in the current tab which is the default
      // browser behavior on ctrl+f click
      event.preventDefault();
      onShortcutTriggered?.();
    }
  };
  onMount(() => document.addEventListener("keydown", handleShortcut));
  onCleanup(() => {
    document.removeEventListener("keydown", handleShortcut);
  });
}
