import { onCleanup, splitProps } from "solid-js";

import { useDropdownContext } from "@/popup/components/dropdown/context.jsx";

import styles from "./MenuItem.module.css";

export default function MenuItem(props) {
  let ref;
  const [extra, rest] = splitProps(props, [
    "class",
    "keepOpenOnClick",
    "onClick",
  ]);
  const { registerItem, closeMenu, unregisterItem } = useDropdownContext();
  onCleanup(() => {
    unregisterItem(ref);
  });

  return (
    <div
      ref={(elt) => {
        registerItem(elt);
        ref = elt;
      }}
      onClick={(event) => {
        if (!extra.keepOpenOnClick) {
          closeMenu();
        }
        if (extra.onClick) {
          extra.onClick(event);
        }
      }}
      class={`${styles["dropdown-menu-item"]} ${extra.class ?? ""}`}
      tabindex="-1"
      role="menuitem"
      {...rest}
    />
  );
}
