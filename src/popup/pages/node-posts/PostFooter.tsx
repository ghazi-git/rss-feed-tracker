import { FeedPost } from "@/messaging-wrapper";
import SingleLineText from "@/popup/components/SingleLineText";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import BookmarkToggle from "@/popup/pages/node-posts/BookmarkToggle";
import { usePostsContext } from "@/popup/pages/node-posts/posts-context";
import UnreadToggle from "@/popup/pages/node-posts/UnreadToggle";
import { hideLinkPreview } from "@/popup/store/link-preview";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes";

import styles from "./PostFooter.module.css";

export default function PostFooter(props: { post: FeedPost }) {
  const { toggleUnread } = usePostsContext();

  return (
    <div class={styles.footer}>
      <div class={styles["feed-favicon"]}>
        <FeedFavicon
          favicon={props.post.feedFavicon}
          name={props.post.feedName}
        />
      </div>
      <SingleLineText text={props.post.feedName} class={styles["feed-name"]} />
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
        <BookmarkToggle bookmarked={!!props.post.bookmarked} />
        <UnreadToggle
          unread={!!props.post.unread}
          onToggleUnread={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const newUnread = !props.post.unread;
            await toggleUnread(props.post.feedId, props.post.guid, newUnread);
          }}
        />
      </div>
    </div>
  );
}
