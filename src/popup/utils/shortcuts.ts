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
  onMount(() => {
    hotkeys("ctrl+shift+f", (event) => {
      event.stopPropagation();
      onShortcutTriggered();
    });
  });
  onCleanup(() => hotkeys.unbind("ctrl+shift+f"));
}

export function handleFilterShortcut(onShortcutTriggered: () => void) {
  onMount(() => {
    hotkeys("ctrl+f", (event) => {
      // avoid the find popup appearing in the current tab which is the default
      // browser behavior on ctrl+f click
      event.preventDefault();
      onShortcutTriggered();
    });
  });
  onCleanup(() => hotkeys.unbind("ctrl+f"));
}

export function handleExitFilterShortcut() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{ previousUrl?: string }>();
  onMount(() => {
    hotkeys("escape", (event) => {
      // prevent the default behavior (closing the extension popup)
      event.preventDefault();
      navigate(searchParams.previousUrl ?? "/library");
    });
  });
  onCleanup(() => hotkeys.unbind("ctrl+f"));
}

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
