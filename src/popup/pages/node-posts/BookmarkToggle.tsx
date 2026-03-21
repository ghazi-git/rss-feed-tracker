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
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onAuxClick={(event) => {
          if (event.button === 1) {
            // middle mouse btn click
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        title={props.bookmarked ? "Delete bookmark" : "Bookmark"}
        role="button"
        tabindex={props.tabindex}
      >
        {props.bookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
      </div>
    </div>
  );
}

interface BookmarkToggleProps {
  bookmarked: boolean;
  onToggleBookmarked: (event: Event) => Promise<void>;
  tabindex: number;
}
