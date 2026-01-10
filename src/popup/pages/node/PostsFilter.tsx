import { createSignal, Show } from "solid-js";

import Anchor from "@/popup/components/Anchor";
import UnreadCount from "@/popup/pages/node/UnreadCount";

import styles from "./PostsFilter.module.css";

export default function PostsFilter(props: PostsFilterProps) {
  const [activeFilter, setActiveFilter] = createSignal(props.initialFilter);

  return (
    <div class={`${props.class} ${styles["filter-options"]}`}>
      <Anchor
        href={`${props.pageUrl}?unread=true`}
        class={`${styles.filter} ${styles.unread}`}
        classList={{ [styles.active]: activeFilter() === "unread" }}
        onClick={() => setActiveFilter("unread")}
      >
        <Show when={props.unreadCount}>
          <UnreadCount
            count={props.unreadCount}
            isLoading={props.markAsReadMutation.isLoading() ?? false}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              props.markAsReadMutation.markAll();
            }}
          />
        </Show>
        <span>Unread</span>
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
  markAsReadMutation: {
    markAll: () => Promise<void>;
    isLoading: () => boolean;
  };
}
