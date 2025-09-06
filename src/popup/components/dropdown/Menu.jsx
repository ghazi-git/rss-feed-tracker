import { Show, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { useDropdownContext } from "@/popup/components/dropdown/context.jsx";

import styles from "./Menu.module.css";

export default function Menu(props) {
  const [extra, rest] = splitProps(props, ["class"]);
  const { store, registerMenuRef, closeMenu, focusItem } = useDropdownContext();

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
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              closeMenu();
              store.triggerRef.focus();
              if (event.shiftKey) {
                // so that focus stays on the trigger
                event.preventDefault();
              }
            } else if (event.key === "Escape") {
              closeMenu();
              store.triggerRef.focus();
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
