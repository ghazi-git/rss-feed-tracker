import { Show } from "solid-js";
import { dismissToast, showToast } from "solid-notifications";

import Anchor from "@/popup/components/Anchor.jsx";
import Dropdown from "@/popup/components/dropdown/Dropdown.jsx";
import Menu from "@/popup/components/dropdown/Menu.jsx";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger.jsx";
import FeedActions from "@/popup/components/FeedActions.jsx";
import FolderActions from "@/popup/components/FolderActions.jsx";
import FolderIcon from "@/popup/components/svg-icons/FolderIcon.jsx";
import ThreeDotIcon from "@/popup/components/svg-icons/ThreeDotIcon.jsx";
import FeedFavicon from "@/popup/pages/node/FeedFavicon.jsx";
import NodeName from "@/popup/pages/node/NodeName.jsx";
import UnreadCount from "@/popup/pages/node/UnreadCount.jsx";

import styles from "./FolderChild.module.css";

export default function FolderChild(props) {
  return (
    <Anchor class={styles.child} href={`/library/nodes/${props.node.id}`}>
      <div class={styles.icon}>
        <Show when={props.node.type === "feed"} fallback={<FolderIcon />}>
          <FeedFavicon
            favicon={props.node.feed.favicon}
            name={props.node.name}
          />
        </Show>
        <Show when={props.node.unreadCount}>
          <UnreadCount
            count={props.node.unreadCount}
            onClick={(event) => {
              event.preventDefault();
              dismissToast();
              showToast("Marked as read (not really though)");
            }}
          />
        </Show>
      </div>
      <NodeName name={props.node.name} />
      <Dropdown placement="bottom-end" fallbackPlacement="left">
        <MenuTrigger onClick={(event) => event.preventDefault()}>
          <ThreeDotIcon class={styles["post-actions-icon"]} />
        </MenuTrigger>
        <Menu>
          <Show
            when={props.node.type === "folder"}
            fallback={
              <FeedActions feedId={props.node.id} feedName={props.node.name} />
            }
          >
            <FolderActions
              folderId={props.node.id}
              folderName={props.node.name}
            />
          </Show>
        </Menu>
      </Dropdown>
    </Anchor>
  );
}
