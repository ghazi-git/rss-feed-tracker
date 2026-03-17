import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuStateIndicator from "@/popup/components/dropdown/MenuStateIndicator";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger";
import PageTitle from "@/popup/components/page-header/PageTitle";
import { createShortcut } from "@/popup/utils/shortcuts";

import styles from "./PageTitleMenuTrigger.module.css";

export default function PageTitleMenuTrigger(props: PageTitleButtonProps) {
  const { store, openMenu, focusItem, closeMenu, focusTrigger } =
    useDropdownContext();
  createShortcut("ctrl+t", () => {
    if (store.open) {
      closeMenu();
      focusTrigger();
    } else {
      openMenu();
      focusItem("first");
    }
  });

  return (
    <MenuTrigger
      class={`${styles["page-title-button"]} ${props.feedUpdatesOff ? styles["updates-off"] : ""}`}
    >
      <MenuStateIndicator />
      <PageTitle title={props.title} />
    </MenuTrigger>
  );
}

interface PageTitleButtonProps {
  title: string;
  feedUpdatesOff?: boolean;
}
