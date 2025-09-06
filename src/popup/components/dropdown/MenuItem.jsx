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
  const onItemClicked = (event) => {
    if (extra.onClick) {
      extra.onClick(event);
    }
    if (!extra.keepOpenOnClick) {
      closeMenu();
    }
  };
  onCleanup(() => {
    unregisterItem(ref);
  });

  return (
    <div
      ref={(elt) => {
        registerItem(elt);
        ref = elt;
      }}
      onClick={onItemClicked}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onItemClicked(event);
        }
      }}
      class={`${styles["dropdown-menu-item"]} ${extra.class ?? ""}`}
      tabindex="-1"
      role="menuitem"
      {...rest}
    />
  );
}
