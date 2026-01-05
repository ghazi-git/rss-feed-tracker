import { createSignal, Show } from "solid-js";

import Anchor from "@/popup/components/Anchor";
import UnreadCount from "@/popup/pages/node/UnreadCount";
import { usePostsFilterUnreadCountContext } from "@/popup/pages/posts-filter-unread-count-context";

import styles from "./PostsFilter.module.css";

export default function PostsFilter(props: PostsFilterProps) {
  const [activeFilter, setActiveFilter] = createSignal(props.initialFilter);
  const { markAsReadMutation } = usePostsFilterUnreadCountContext();

  return (
    <div class={`${props.class} ${styles["filter-options"]}`}>
      <Anchor
        href={`${props.pageUrl}?unread=true`}
        class={`${styles.filter} ${styles.unread}`}
        classList={{ [styles.active]: activeFilter() === "unread" }}
        onClick={() => setActiveFilter("unread")}
      >
        <span>Unread</span>
        <Show when={props.unreadCount}>
          <UnreadCount
            count={props.unreadCount}
            isLoading={markAsReadMutation.isLoading() ?? false}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              markAsReadMutation.markAll();
            }}
          />
        </Show>
      </Anchor>
      <Anchor
        href={props.pageUrl}
        class={`${styles.filter} ${styles.all}`}
        classList={{ [styles.active]: activeFilter() === "all" }}
        onClick={() => setActiveFilter("all")}
      >
        <span>All</span>
      </Anchor>
    </div>
  );
}

interface PostsFilterProps {
  unreadCount: number;
  pageUrl: string;
  class: string;
  initialFilter: "all" | "unread" | null;
}
