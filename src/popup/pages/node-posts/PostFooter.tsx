import { Show } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import SingleLineText from "@/popup/components/SingleLineText";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import BookmarkToggle from "@/popup/pages/node-posts/BookmarkToggle";
import CommentsLink from "@/popup/pages/node-posts/CommentsLink";
import { useToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { useToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import UnreadToggle from "@/popup/pages/node-posts/UnreadToggle";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes";
import { isFocusedPost } from "@/popup/utils/keyboard-nav";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

import styles from "./PostFooter.module.css";

export default function PostFooter(props: { post: FeedPost }) {
  const { toggleUnread } = useToggleUnreadContext();
  const { toggleBookmarked } = useToggleBookmarkedContext();
  const { preferences } = usePreferencesContext();
  const orderByFetchedAt = () => preferences.orderPostsBy === "fetchedAt";
  const { focusedItem } = useListNavigationContext();
  const actionsTabindex = () =>
    isFocusedPost(focusedItem(), props.post.feedId, props.post.guid) ? 0 : -1;

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
          orderByFetchedAt()
            ? `Fetched: ${formatTimestamp(props.post.fetchedAt)}`
            : `Published: ${formatTimestamp(props.post.publishedAt)}`
        }
      >
        {orderByFetchedAt()
          ? humanizeTimestamp(props.post.fetchedAt)
          : humanizeTimestamp(props.post.publishedAt)}
      </div>
      <div class={styles.actions}>
        <Show when={props.post.commentsURL}>
          {(url) => <CommentsLink url={url()} tabindex={actionsTabindex()} />}
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
          tabindex={actionsTabindex()}
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
          tabindex={actionsTabindex()}
        />
      </div>
    </div>
  );
}
