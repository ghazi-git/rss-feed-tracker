import { Show } from "solid-js";

import Dropdown from "@/popup/components/dropdown/Dropdown";
import Menu from "@/popup/components/dropdown/Menu";
import MenuStateIndicator from "@/popup/components/dropdown/MenuStateIndicator";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger";
import FeedActions from "@/popup/components/FeedActions.jsx";
import FolderActions from "@/popup/components/FolderActions.jsx";
import PageTitle from "@/popup/components/page-header/PageTitle.jsx";

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
        <Show
          when={props.nodeType === "folder"}
          fallback={
            <FeedActions feedId={props.nodeId} feedName={props.nodeName} />
          }
        >
          <FolderActions
            isRoot={props.isRoot}
            folderId={props.nodeId}
            folderName={props.nodeName}
          />
        </Show>
      </Menu>
    </Dropdown>
  );
}
