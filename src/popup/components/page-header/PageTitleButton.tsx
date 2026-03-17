import { Show } from "solid-js";

import Dropdown from "@/popup/components/dropdown/Dropdown";
import Menu from "@/popup/components/dropdown/Menu";
import NodeHeaderFeedActions from "@/popup/components/node-actions/NodeHeaderFeedActions";
import NodeHeaderFolderActions from "@/popup/components/node-actions/NodeHeaderFolderActions";
import PageTitleMenuTrigger from "@/popup/components/page-header/PageTitleMenuTrigger";

import styles from "./PageTitleButton.module.css";

export default function PageTitleButton(props: PageTitleButtonProps) {
  return (
    <Dropdown placement="bottom-start">
      <PageTitleMenuTrigger
        title={props.title}
        feedUpdatesOff={props.feedUpdatesOff}
      />
      <Menu class={styles["dropdown-menu"]}>
        <Show
          when={props.nodeType === "folder"}
          fallback={
            <NodeHeaderFeedActions
              feedId={props.nodeId}
              feedName={props.nodeName}
              parentFolderId={props.parentFolderId}
            />
          }
        >
          <NodeHeaderFolderActions
            isRoot={props.isRoot}
            folderId={props.nodeId}
            folderName={props.nodeName}
            parentFolderId={props.parentFolderId}
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
  parentFolderId: number | null;
  feedUpdatesOff?: boolean;
}
