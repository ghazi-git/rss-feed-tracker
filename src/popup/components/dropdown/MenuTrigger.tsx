import { JSX, mergeProps, splitProps } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import { useDropdownContext } from "@/popup/components/dropdown/context";

import styles from "./MenuTrigger.module.css";

/**
 * Accessibility implementation details are based on this link
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 */
export default function MenuTrigger(props: TriggerProps) {
  const propsWithDefaults = mergeProps({ openMenuOnClick: true }, props);
  const [extra, rest] = splitProps(propsWithDefaults, [
    "class",
    "openMenuOnClick",
    "onClick",
  ]);
  const { store, registerTriggerRef, openMenu, focusItem } =
    useDropdownContext();

  return (
    <UnstyledButton
      id={store.triggerId}
      class={`${styles["menu-trigger"]} ${extra.class ?? ""}`}
      ref={(elt) => {
        registerTriggerRef(elt);
      }}
      aria-haspopup="true"
      aria-expanded={store.open ?? undefined}
      aria-controls={store.open ? store.menuId : undefined}
      onClick={(event) => {
        if (extra.onClick) {
          extra.onClick(event);
        }
        if (extra.openMenuOnClick && !store.open) {
          openMenu();
          focusItem("first");
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          openMenu();
          focusItem("first");
        } else if (event.key === "ArrowDown") {
          openMenu();
          focusItem("first");
        } else if (event.key === "ArrowUp") {
          openMenu();
          focusItem("last");
        }
      }}
      {...rest}
    />
  );
}

interface TriggerProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  openMenuOnClick?: boolean;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}
