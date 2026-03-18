import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger";
import ThreeDotIcon from "@/popup/components/svg-icons/ThreeDotIcon";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import { createShortcut } from "@/popup/utils/shortcuts";

import styles from "./FolderChildMenuTrigger.module.css";

export default function FolderChildMenuTrigger(
  props: FolderChildMenuTriggerProps,
) {
  const { focusedIndex } = useListNavigationContext();
  const { store, openMenu, focusItem, closeMenu, focusTrigger } =
    useDropdownContext();
  createShortcut("t", () => {
    if (
      !store.open &&
      focusedIndex() === props.nodeIndex &&
      props.nodeHasFocus()
    ) {
      // allow opening the menu only when focus is inside the child node
      openMenu();
      focusItem("first");
    } else if (store.open && focusedIndex() === props.nodeIndex) {
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
      tabindex="-1"
    >
      <ThreeDotIcon class={styles.icon} />
    </MenuTrigger>
  );
}

interface FolderChildMenuTriggerProps {
  label: string;
  nodeHasFocus: () => boolean;
  nodeIndex: number;
}
