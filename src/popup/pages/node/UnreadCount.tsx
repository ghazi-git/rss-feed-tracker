import { createMemo, JSX } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";

import styles from "./UnreadCount.module.css";

export default function UnreadCount(props: UnreadCountProps) {
  const count = createMemo(() => {
    if (props.count > 1000) {
      return "+1k";
    } else if (props.count === 1000) {
      return "1k";
    } else {
      return `${props.count}`;
    }
  });
  return (
    <UnstyledButton
      class={styles.count}
      onClick={(e) => {
        props.onClick(e);
      }}
      title="Mark all as read"
    >
      {count()}
    </UnstyledButton>
  );
}

interface UnreadCountProps {
  count: number;
  onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}
