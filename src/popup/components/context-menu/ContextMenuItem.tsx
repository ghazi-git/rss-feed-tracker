import { JSX, onCleanup, splitProps } from "solid-js";

import { useContextMenuContext } from "@/popup/components/context-menu/context";

import styles from "./ContextMenuItem.module.css";

/**
 * Accessibility work is based on https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 */
export default function ContextMenuItem(props: ContextMenuItemProps) {
  let ref: HTMLDivElement;
  const [extra, rest] = splitProps(props, ["class", "onSelected"]);
  const { registerItem, unregisterItem, focusItemByRef } =
    useContextMenuContext();
  onCleanup(() => {
    unregisterItem(ref);
  });

  return (
    <div
      ref={(elt) => {
        registerItem(elt);
        ref = elt;
      }}
      class={`${styles["context-menu-item"]} ${extra.class ?? ""}`}
      onClick={(event) => {
        extra.onSelected(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          extra.onSelected(event);
        } else if (event.key === " ") {
          event.preventDefault();
          extra.onSelected(event);
        }
      }}
      onMouseEnter={() => {
        focusItemByRef(ref);
      }}
      tabindex="-1"
      role="menuitem"
      {...rest}
    />
  );
}

interface ContextMenuItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
  onSelected: JSX.EventHandler<HTMLDivElement, UIEvent>;
}
