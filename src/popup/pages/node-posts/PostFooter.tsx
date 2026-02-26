import { Show } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import SingleLineText from "@/popup/components/SingleLineText";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import BookmarkToggle from "@/popup/pages/node-posts/BookmarkToggle";
import CommentsLink from "@/popup/pages/node-posts/CommentsLink";
import { useToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { useToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import UnreadToggle from "@/popup/pages/node-posts/UnreadToggle";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

import styles from "./PostFooter.module.css";

export default function PostFooter(props: { post: FeedPost }) {
  const { toggleUnread } = useToggleUnreadContext();
  const { toggleBookmarked } = useToggleBookmarkedContext();
  const { preferences } = usePreferencesContext();
  const orderByReceivedAt = () => preferences.orderPostsBy === "receivedAt";

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
        class={styles.time}
        title={
          orderByReceivedAt()
            ? `Fetched: ${formatTimestamp(props.post.receivedAt)}`
            : `Published: ${formatTimestamp(props.post.publishedAt)}`
        }
      >
        {orderByReceivedAt()
          ? humanizeTimestamp(props.post.receivedAt)
          : humanizeTimestamp(props.post.publishedAt)}
      </div>
      <div class={styles.actions}>
        <Show when={props.post.commentsURL}>
          {(url) => <CommentsLink url={url()} />}
        </Show>
        <BookmarkToggle
          bookmarked={!!props.post.bookmarked}
          onToggleBookmarked={
            // eslint-disable-next-line solid/reactivity
            async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await toggleBookmarked(
                props.post.feedId,
                props.post.guid,
                !props.post.bookmarked,
              );
            }
          }
        />
        <UnreadToggle
          unread={!!props.post.unread}
          onToggleUnread={
            // eslint-disable-next-line solid/reactivity
            async (event) => {
              event.preventDefault();
              event.stopPropagation();
              const newUnread = !props.post.unread;
              await toggleUnread(props.post.feedId, props.post.guid, newUnread);
            }
          }
        />
      </div>
    </div>
  );
}
