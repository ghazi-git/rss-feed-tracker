import { Show } from "solid-js";
import { dismissToast, showToast } from "solid-notifications";

import BookmarkedIcon from "@/popup/components/svg-icons/BookmarkedIcon.jsx";
import BookmarkIcon from "@/popup/components/svg-icons/BookmarkIcon.jsx";

import styles from "./BookmarkToggle.module.css";

export default function BookmarkToggle(props) {
  const deleteBookmark = (event) => {
    event.preventDefault();
    dismissToast();
    showToast("Bookmark deleted");
  };
  const createBookmark = (event) => {
    event.preventDefault();
    dismissToast();
    showToast("Bookmark deleted");
  };
  return (
    <div class={styles["bookmark-toggle"]}>
      <Show when={props.bookmarked}>
        <div
          class={styles.bookmarked}
          onClick={deleteBookmark}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              deleteBookmark(event);
            }
          }}
          title="Delete bookmark"
          role="button"
          tabindex="0"
        >
          <BookmarkedIcon />
        </div>
      </Show>
      <Show when={!props.bookmarked}>
        <div
          onClick={createBookmark}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              createBookmark(event);
            }
          }}
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
