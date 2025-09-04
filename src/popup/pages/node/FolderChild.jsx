import { Show } from "solid-js";
import { dismissToast, showToast } from "solid-notifications";

import Anchor from "@/popup/components/Anchor.jsx";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton.jsx";
import FolderIcon from "@/popup/components/svg-icons/FolderIcon.jsx";
import ThreeDotIcon from "@/popup/components/svg-icons/ThreeDotIcon.jsx";
import { singleLineEllipsis } from "@/popup/directives/ellipsis.js";
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
      <span use:singleLineEllipsis={props.node.name} dir="auto">
        {props.node.name}
      </span>
      <UnstyledButton
        onClick={(event) => {
          event.preventDefault();
        }}
      >
        <ThreeDotIcon class={styles["post-actions-icon"]} />
      </UnstyledButton>
    </Anchor>
  );
}
