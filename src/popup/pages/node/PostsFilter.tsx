import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, Show } from "solid-js";

import { PostsView } from "@/messaging-wrapper";
import Anchor from "@/popup/components/Anchor";
import UnreadCount from "@/popup/pages/node/UnreadCount";
import { createShortcut } from "@/popup/utils/shortcuts";

import styles from "./PostsFilter.module.css";

export default function PostsFilter(props: PostsFilterProps) {
  const [activeFilter, setActiveFilter] = createSignal<PostsView | null>(null);
  createEffect(() => {
    // derive activeFilter from props.postsView in solid 2.0
    setActiveFilter(props.postsView);
  });
  const navigate = useNavigate();
  createShortcut("ctrl+m", () => {
    if (props.unreadCount) props.markAsReadMutation.markAll();
  });
  createShortcut("ctrl+u", () => navigate(`${props.pageUrl}?unread=true`));
  createShortcut("ctrl+a", () => navigate(props.pageUrl));

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
  postsView: PostsView | null;
  markAsReadMutation: {
    markAll: () => Promise<void>;
    isLoading: () => boolean;
  };
}
