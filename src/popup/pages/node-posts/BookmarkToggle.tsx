import BookmarkedIcon from "@/popup/components/svg-icons/BookmarkedIcon";
import BookmarkIcon from "@/popup/components/svg-icons/BookmarkIcon";

import styles from "./BookmarkToggle.module.css";

export default function BookmarkToggle(props: BookmarkToggleProps) {
  return (
    <div class={styles["bookmark-toggle"]}>
      <div
        class={props.bookmarked ? styles.bookmarked : ""}
        onClick={async (event) => {
          await props.onToggleBookmarked(event);
        }}
        onKeyDown={async (event) => {
          if (event.key === "Enter") {
            await props.onToggleBookmarked(event);
          }
        }}
        title={props.bookmarked ? "Delete bookmark" : "Bookmark"}
        role="button"
        tabindex="0"
      >
        {props.bookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
      </div>
    </div>
  );
}

interface BookmarkToggleProps {
  bookmarked: boolean;
  onToggleBookmarked: (event: Event) => Promise<void>;
}
