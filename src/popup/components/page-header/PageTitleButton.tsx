import { Show } from "solid-js";

import Dropdown from "@/popup/components/dropdown/Dropdown";
import Menu from "@/popup/components/dropdown/Menu";
import MenuStateIndicator from "@/popup/components/dropdown/MenuStateIndicator";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger";
import NodeHeaderFeedActions from "@/popup/components/node-actions/NodeHeaderFeedActions";
import NodeHeaderFolderActions from "@/popup/components/node-actions/NodeHeaderFolderActions";
import PageTitle from "@/popup/components/page-header/PageTitle";

import styles from "./PageTitleButton.module.css";

export default function PageTitleButton(props: PageTitleButtonProps) {
  return (
    <Dropdown placement="bottom-start">
      <MenuTrigger
        class={`${styles["page-title-button"]} ${props.feedUpdatesOff ? styles["updates-off"] : ""}`}
      >
        <div class={styles["node-actions"]}>
          <MenuStateIndicator />
        </div>
        <PageTitle title={props.title} />
      </MenuTrigger>
      <Menu class={styles["dropdown-menu"]}>
        <Show
          when={props.nodeType === "folder"}
          fallback={
            <NodeHeaderFeedActions
              feedId={props.nodeId}
              feedName={props.nodeName}
            />
          }
        >
          <NodeHeaderFolderActions
            isRoot={props.isRoot}
            folderId={props.nodeId}
            folderName={props.nodeName}
          />
        </Show>
      </Menu>
    </Dropdown>
  );
}

interface PageTitleButtonProps {
  title: string;
  isRoot: boolean;
  nodeType: "folder" | "feed";
  nodeId: number;
  nodeName: string;
  feedUpdatesOff?: boolean;
}
