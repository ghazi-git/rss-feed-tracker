import { JSX, Show } from "solid-js";
import { dismissToast } from "solid-notifications";

import BookmarkedIcon from "@/popup/components/svg-icons/BookmarkedIcon";
import BookmarkIcon from "@/popup/components/svg-icons/BookmarkIcon";
import { notifyInfo } from "@/popup/utils/notifications";

import styles from "./BookmarkToggle.module.css";

export default function BookmarkToggle(props: { bookmarked: boolean }) {
  const deleteBookmark: ClickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dismissToast();
    notifyInfo("Bookmark deleted a lot", { duration: 800_000 });
  };
  const createBookmark: ClickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dismissToast();
    notifyInfo("Bookmark created");
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

type ClickHandler = JSX.EventHandler<HTMLDivElement, UIEvent>;
