import { FlowProps, JSX, mergeProps, onCleanup, splitProps } from "solid-js";

import { useDropdownContext } from "@/popup/components/dropdown/context";

import styles from "./MenuItem.module.css";

export default function MenuItem(props: FlowProps<MenuItemProps>) {
  let ref: HTMLDivElement;
  const propsWithDefaults = mergeProps({ closeMenuOnClick: true }, props);
  const [extra, rest] = splitProps(propsWithDefaults, [
    "class",
    "closeMenuOnClick",
    "onClick",
  ]);
  const { registerItem, closeMenu, unregisterItem, focusItemByRef } =
    useDropdownContext();
  const onItemClicked: ItemHandler = (event) => {
    if (extra.onClick) {
      extra.onClick(event);
    }
    if (extra.closeMenuOnClick) {
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
      onMouseEnter={() => {
        focusItemByRef(ref);
      }}
      class={`${styles["dropdown-menu-item"]} ${extra.class ?? ""}`}
      tabindex="-1"
      role="menuitem"
      {...rest}
    />
  );
}
type ItemHandler = JSX.EventHandler<HTMLDivElement, UIEvent>;

interface MenuItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
  onClick?: ItemHandler;
}
