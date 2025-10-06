import { FlowProps, JSX, Show, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { useDropdownContext } from "@/popup/components/dropdown/context";

import styles from "./Menu.module.css";

/**
 * Accessibility implementation details are based on this link
 * https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 * aria-disabled and submenu work not done since they are not needed (not yet at least)
 */
export default function Menu(props: FlowProps<MenuProps>) {
  const [extra, rest] = splitProps(props, ["class"]);
  const { store, registerMenuRef, closeMenu, focusItem, focusTrigger } =
    useDropdownContext();

  return (
    <Show when={store.open}>
      <Portal>
        <div
          id={store.menuId}
          ref={(elt) => {
            registerMenuRef(elt);
          }}
          class={`${styles.menu} ${store.open ? styles["menu-visible"] : ""} ${extra.class ?? ""}`}
          role="menu"
          aria-labelledby={store.triggerId}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              closeMenu();
              focusTrigger();
              if (event.shiftKey) {
                // so that focus stays on the trigger
                event.preventDefault();
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              closeMenu();
              focusTrigger();
            } else if (event.key === "ArrowDown") {
              focusItem("next");
            } else if (event.key === "ArrowUp") {
              focusItem("previous");
            } else if (event.key === "Home" || event.key === "PageUp") {
              focusItem("first");
            } else if (event.key === "End" || event.key === "PageDown") {
              focusItem("last");
            }
          }}
          {...rest}
        />
      </Portal>
    </Show>
  );
}

type MenuProps = JSX.HTMLAttributes<HTMLDivElement>;
