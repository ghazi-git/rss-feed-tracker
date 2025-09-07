import { Show } from "solid-js";

import Dropdown from "@/popup/components/dropdown/Dropdown.jsx";
import Menu from "@/popup/components/dropdown/Menu.jsx";
import MenuStateIndicator from "@/popup/components/dropdown/MenuStateIndicator.jsx";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger.jsx";
import FeedActions from "@/popup/components/FeedActions.jsx";
import FolderActions from "@/popup/components/FolderActions.jsx";
import PageTitle from "@/popup/components/PageTitle.jsx";

import styles from "./PageTitleButton.module.css";

export default function PageTitleButton(props) {
  return (
    <Dropdown placement="bottom-start">
      <MenuTrigger class={styles["page-title-button"]}>
        <div class={styles["node-actions"]}>
          <MenuStateIndicator />
        </div>
        <PageTitle title={props.title} />
      </MenuTrigger>
      <Menu>
        <Show when={props.nodeType === "folder"} fallback={<FeedActions />}>
          <FolderActions isRoot={props.isRoot} />
        </Show>
      </Menu>
    </Dropdown>
  );
}
