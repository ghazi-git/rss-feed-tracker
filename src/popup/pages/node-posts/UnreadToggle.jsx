import { Show } from "solid-js";
import { showToast } from "solid-notifications";

import styles from "./UnreadToggle.module.css";

export default function UnreadToggle(props) {
  return (
    <div class={styles["unread-toggle"]}>
      <Show when={props.unread}>
        <div
          class={styles.unread}
          onClick={() => showToast("Marked as read")}
          title="Mark as read"
          role="button"
          tabindex="0"
        />
      </Show>
      <Show when={!props.unread}>
        <div
          class={styles.read}
          onClick={() => showToast("Marked as unread")}
          title="Mark as unread"
          role="button"
          tabindex="0"
        />
      </Show>
    </div>
  );
}
