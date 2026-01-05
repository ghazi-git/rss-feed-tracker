import { Show } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";

import styles from "./LoadMorePosts.module.css";

export default function LoadMorePosts(props: LoadMorePostsProps) {
  return (
    <UnstyledButton
      class={styles["load-more"]}
      disabled={props.loading}
      onClick={() => {
        props.onClick();
      }}
    >
      <Show when={!props.loading} fallback="Loading...">
        Load more
        <span>(already showing {props.postsCount} posts)</span>
      </Show>
    </UnstyledButton>
  );
}

interface LoadMorePostsProps {
  loading: boolean;
  onClick: () => void;
  postsCount: number;
}
