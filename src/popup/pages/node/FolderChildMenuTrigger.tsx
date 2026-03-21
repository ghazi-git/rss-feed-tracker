import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger";
import ThreeDotIcon from "@/popup/components/svg-icons/ThreeDotIcon";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import { isFocusedNode } from "@/popup/utils/keyboard-nav";
import { createShortcut } from "@/popup/utils/shortcuts";

import styles from "./FolderChildMenuTrigger.module.css";

export default function FolderChildMenuTrigger(
  props: FolderChildMenuTriggerProps,
) {
  const { focusedItem } = useListNavigationContext();
  const { store, openMenu, focusItem, closeMenu, focusTrigger } =
    useDropdownContext();
  createShortcut("t", () => {
    if (
      !store.open &&
      isFocusedNode(focusedItem(), props.nodeId) &&
      props.htmlElementHasFocus()
    ) {
      // allow opening the menu only when focus is inside the child node
      openMenu();
      focusItem("first");
    } else if (store.open && isFocusedNode(focusedItem(), props.nodeId)) {
      // allow closing the menu even if focus is outside the child node. That's
      // because the dropdown menu is appended to the body tag
      closeMenu();
      focusTrigger();
    }
  });

  return (
    <MenuTrigger
      onClick={(event) => event.preventDefault()}
      aria-label={props.label}
      tabindex={props.tabindex}
      onKeyDown={(event) => {
        // don't open the menu on arrow up/down to avoid conflicting with using
        // arrow up/down for navigating the folder children
        if (event.key === "Enter" || event.key === " ") {
          event.stopPropagation();
          openMenu();
          focusItem("first");
        }
      }}
    >
      <ThreeDotIcon class={styles.icon} />
    </MenuTrigger>
  );
}

interface FolderChildMenuTriggerProps {
  label: string;
  htmlElementHasFocus: () => boolean;
  nodeId: number;
  tabindex: number;
}
