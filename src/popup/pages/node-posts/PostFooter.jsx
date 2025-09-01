import { singleLineEllipsis } from "@/popup/directives/ellipsis.js";
import FeedFavicon from "@/popup/pages/node/FeedFavicon.jsx";
import BookmarkToggle from "@/popup/pages/node-posts/BookmarkToggle.jsx";
import UnreadToggle from "@/popup/pages/node-posts/UnreadToggle.jsx";
import { hideLinkPreview } from "@/popup/store/link-preview.js";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes.js";

import styles from "./PostFooter.module.css";

export default function PostFooter(props) {
  return (
    <div class={styles.footer}>
      <div class={styles["feed-favicon"]}>
        <FeedFavicon
          favicon={props.post.feed.favicon}
          name={props.post.feed.name}
        />
      </div>
      <div
        class={styles["feed-name"]}
        dir="auto"
        use:singleLineEllipsis={props.post.feed.name}
      >
        {props.post.feed.name}
      </div>
      <span class={styles.separator}>◆</span>
      <div
        class={styles["published-at"]}
        title={formatTimestamp(props.post.publishedAt)}
      >
        {humanizeTimestamp(props.post.publishedAt)}
      </div>
      <div
        class={styles.actions}
        onMouseOver={(event) => {
          event.stopPropagation();
          hideLinkPreview();
        }}
      >
        <BookmarkToggle bookmarked={props.post.bookmarked} />
        <UnreadToggle unread={props.post.unread} />
      </div>
    </div>
  );
}
