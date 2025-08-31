import { useSearchParams } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { dismissToast, showToast } from "solid-notifications";

import Anchor from "@/popup/components/Anchor.jsx";
import UnreadCount from "@/popup/pages/node/UnreadCount.jsx";
import { isPostsPage } from "@/popup/utils/posts.js";

import styles from "./PostsFilter.module.css";

export default function PostsFilter(props) {
  const [activeFilter, setActiveFilter] = createSignal(getCurrentFilter());

  return (
    <div class={styles["filter-options"]}>
      <Anchor
        href={`/home/nodes/${props.nodeId}/posts?unread=true`}
        class={`${styles.filter} ${styles.unread}`}
        classList={{ [styles.active]: activeFilter() === "unread" }}
        onClick={() => setActiveFilter("unread")}
      >
        <span>Unread</span>
        <Show when={props.unreadCount}>
          <UnreadCount
            count={props.unreadCount}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dismissToast();
              showToast("Marked as read (not really though)");
            }}
          />
        </Show>
      </Anchor>
      <Anchor
        href={`/home/nodes/${props.nodeId}/posts`}
        class={`${styles.filter} ${styles.all}`}
        classList={{ [styles.active]: activeFilter() === "all" }}
        onClick={() => setActiveFilter("all")}
      >
        <span>All</span>
      </Anchor>
    </div>
  );
}

function getCurrentFilter() {
  if (!isPostsPage()) return null;

  const [searchParams] = useSearchParams();
  return searchParams.unread === "true" ? "unread" : "all";
}
