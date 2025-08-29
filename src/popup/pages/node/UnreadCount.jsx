import { createMemo } from "solid-js";

import styles from "./UnreadCount.module.css";

export default function UnreadCount(props) {
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
    <span
      class={styles.count}
      onClick={props.onClick}
      title="Mark all as read"
      role="button"
      tabindex="0"
    >
      {count()}
    </span>
  );
}
