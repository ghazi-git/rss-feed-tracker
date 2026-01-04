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
      {props.loading ? "Loading..." : "Load more"}
    </UnstyledButton>
  );
}

interface LoadMorePostsProps {
  loading: boolean;
  onClick: () => void;
}
