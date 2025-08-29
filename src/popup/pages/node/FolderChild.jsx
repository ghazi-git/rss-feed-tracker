import { Show } from "solid-js";
import { dismissToast, showToast } from "solid-notifications";

import Anchor from "@/popup/components/Anchor.jsx";
import FolderIcon from "@/popup/components/svg-icons/FolderIcon.jsx";
import FeedFavicon from "@/popup/pages/node/FeedFavicon.jsx";
import UnreadCount from "@/popup/pages/node/UnreadCount.jsx";

import styles from "./FolderChild.module.css";

export default function FolderChild(props) {
  return (
    <Anchor class={styles.child} href={`/home/nodes/${props.node.id}`}>
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
      <span>{props.node.name}</span>
    </Anchor>
  );
}
