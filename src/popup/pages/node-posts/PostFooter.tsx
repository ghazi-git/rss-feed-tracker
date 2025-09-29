import SingleLineText from "@/popup/components/SingleLineText";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import BookmarkToggle from "@/popup/pages/node-posts/BookmarkToggle";
import { PostType } from "@/popup/pages/node-posts/types";
import UnreadToggle from "@/popup/pages/node-posts/UnreadToggle";
import { hideLinkPreview } from "@/popup/store/link-preview";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes";

import styles from "./PostFooter.module.css";

export default function PostFooter(props: { post: PostType }) {
  return (
    <div class={styles.footer}>
      <div class={styles["feed-favicon"]}>
        <FeedFavicon
          favicon={props.post.feed.favicon}
          name={props.post.feed.name}
        />
      </div>
      <SingleLineText text={props.post.feed.name} class={styles["feed-name"]} />
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
