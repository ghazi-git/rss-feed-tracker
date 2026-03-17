import { useNavigate, useSearchParams } from "@solidjs/router";
import hotkeys from "hotkeys-js";
import { onCleanup, onMount } from "solid-js";

hotkeys.filter = (event: KeyboardEvent) => {
  // allow shortcuts using the ctrl key even from within form fields
  // mainly for moving between filter (ctrl+f) and search (ctrl+shift+f) pages
  // while preserving the query, but the behavior is still useful even for
  // other ctrl-based shortcuts.
  // Escape is allowed to exist filter/search pages event when the focus is
  // inside the filter/search input.
  if (event.ctrlKey || event.key === "Escape") return true;

  return enableShortcut(event);
};

export function handleSearchShortcut(onShortcutTriggered: () => void) {
  createShortcut("ctrl+shift+f", () => onShortcutTriggered());
}

export function handleFilterShortcut(onShortcutTriggered: () => void) {
  createShortcut("ctrl+f", () => onShortcutTriggered());
}

export function handleExitFilterShortcut() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{ previousUrl?: string }>();
  createShortcut("escape", () => {
    navigate(searchParams.previousUrl ?? "/library");
  });
}

export function createShortcut(
  shortcut: Shortcut,
  onShortcutTriggered: (event: KeyboardEvent) => void,
) {
  onMount(() => {
    hotkeys(shortcut, (event) => {
      // avoid default browser actions from triggering (ctrl+f triggers find
      // in tab, escape closes extension, for example)
      event.preventDefault();
      // avoid accidentally triggering user-defined shortcuts for other chrome
      // extensions (chrome://extensions/shortcuts)
      event.stopPropagation();
      onShortcutTriggered(event);
    });
  });
  onCleanup(() => hotkeys.unbind(shortcut));
}

export type Shortcut =
  | "ctrl+l" // go to library page
  | "ctrl+b" // go to bookmarks page
  | "ctrl+p" // go to preferences page
  | "ctrl+alt+left" // go to previous page (the same as the browser back button)
  | "ctrl+alt+right" // go to next page (the same as the browser forward button)
  | "ctrl+f" // go to filter posts page. Enabled in feed/folder/bookmarks pages
  | "ctrl+shift+f" // go to search posts page. Enabled in feed/folder/bookmarks pages
  | "escape"; // go from filter/search page to the previous page

/**
 * Copy of hotkeys.filter
 * https://github.com/jaywcjlove/hotkeys-js/blob/ea655c407644fa550b9cff2005f60ac4a6a081dc/src/index.ts#L87
 */
function enableShortcut(event: KeyboardEvent) {
  const target = (event.target || event.srcElement) as HTMLElement;
  const { tagName } = target;
  let flag = true;
  const isInput =
    tagName === "INPUT" &&
    ![
      "checkbox",
      "radio",
      "range",
      "button",
      "file",
      "reset",
      "submit",
      "color",
    ].includes((target as HTMLInputElement).type);
  // ignore: isContentEditable === 'true', <input> and <textarea> when readOnly
  // state is false, <select>
  if (
    target.isContentEditable ||
    ((isInput || tagName === "TEXTAREA" || tagName === "SELECT") &&
      !(target as HTMLInputElement | HTMLTextAreaElement).readOnly)
  ) {
    flag = false;
  }
  return flag;
}
