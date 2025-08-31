import { Show } from "solid-js";
import { showToast } from "solid-notifications";

import BookmarkedIcon from "@/popup/components/svg-icons/BookmarkedIcon.jsx";
import BookmarkIcon from "@/popup/components/svg-icons/BookmarkIcon.jsx";

import styles from "./BookmarkToggle.module.css";

export default function BookmarkToggle(props) {
  return (
    <div class={styles["bookmark-toggle"]}>
      <Show when={props.bookmarked}>
        <div
          class={styles.bookmarked}
          onClick={() => showToast("Bookmark deleted")}
          title="Delete bookmark"
          role="button"
          tabindex="0"
        >
          <BookmarkedIcon />
        </div>
      </Show>
      <Show when={!props.bookmarked}>
        <div
          onClick={() => showToast("Bookmark created")}
          title="Bookmark"
          role="button"
          tabindex="0"
        >
          <BookmarkIcon />
        </div>
      </Show>
    </div>
  );
}
