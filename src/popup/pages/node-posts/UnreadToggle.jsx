import { Show } from "solid-js";
import { dismissToast, showToast } from "solid-notifications";

import styles from "./UnreadToggle.module.css";

export default function UnreadToggle(props) {
  const markAsRead = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dismissToast();
    showToast("Marked as read");
  };
  const markAsUnread = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dismissToast();
    showToast("Marked as unread");
  };
  return (
    <div class={styles["unread-toggle"]}>
      <Show when={props.unread}>
        <div
          class={styles.unread}
          onClick={markAsRead}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              markAsRead(event);
            }
          }}
          title="Mark as read"
          role="button"
          tabindex="0"
        />
      </Show>
      <Show when={!props.unread}>
        <div
          class={styles.read}
          onClick={markAsUnread}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              markAsUnread(event);
            }
          }}
          title="Mark as unread"
          role="button"
          tabindex="0"
        />
      </Show>
    </div>
  );
}
