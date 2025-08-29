import { Show } from "solid-js";
import { dismissToast, showToast } from "solid-notifications";

import Anchor from "@/popup/components/Anchor.jsx";
import UnreadCount from "@/popup/pages/node/UnreadCount.jsx";

import styles from "./PostsFilter.module.css";

export default function PostsFilter(props) {
  return (
    <div class={styles["filter-options"]}>
      <Anchor
        class={`${styles.filter} ${styles.unread}`}
        href={`/home/nodes/${props.nodeId}/posts?unread=true`}
        activeClass={styles.active}
        end={true}
      >
        <span>Unread</span>
        <Show when={props.unreadCount}>
          <UnreadCount
            count={props.unreadCount}
            onClick={(event) => {
              event.preventDefault();
              dismissToast();
              showToast("Marked as read (not really though)");
            }}
          />
        </Show>
      </Anchor>
      <Anchor
        class={`${styles.filter} ${styles.all}`}
        href={`/home/nodes/${props.nodeId}/posts`}
        activeClass={styles.active}
        end={true}
      >
        <span>All</span>
      </Anchor>
    </div>
  );
}
