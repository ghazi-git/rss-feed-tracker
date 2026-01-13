import UnstyledButton from "@/popup/components/buttons/UnstyledButton";

import styles from "./LoadNewPosts.module.css";

export default function LoadNewPosts(props: { onClick: () => void }) {
  return (
    <UnstyledButton
      class={styles["load-new-posts"]}
      onClick={() => {
        props.onClick();
      }}
    >
      Load new Posts
    </UnstyledButton>
  );
}
