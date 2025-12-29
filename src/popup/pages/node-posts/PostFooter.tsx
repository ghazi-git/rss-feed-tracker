import { Show } from "solid-js";

import { FeedPost, sendMessage } from "@/messaging-wrapper";
import SingleLineText from "@/popup/components/SingleLineText";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import BookmarkToggle from "@/popup/pages/node-posts/BookmarkToggle";
import CommentsLink from "@/popup/pages/node-posts/CommentsLink";
import { usePostsContext } from "@/popup/pages/node-posts/posts-context";
import UnreadToggle from "@/popup/pages/node-posts/UnreadToggle";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./PostFooter.module.css";

export default function PostFooter(props: { post: FeedPost }) {
  const { toggleUnread, mutateBookmarked } = usePostsContext();

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
      <div class={styles.actions}>
        <Show when={props.post.commentsURL}>
          {(url) => <CommentsLink url={url()} />}
        </Show>
        <BookmarkToggle
          bookmarked={!!props.post.bookmarked}
          onToggleBookmarked={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const resp = await sendMessage("posts/toggle-bookmarked", {
              feedId: props.post.feedId,
              guid: props.post.guid,
              bookmarked: !props.post.bookmarked,
            });
            if (resp.success) {
              mutateBookmarked(
                props.post.feedId,
                props.post.guid,
                !props.post.bookmarked,
              );
            } else {
              notifyError(resp.errorMsg);
            }
          }}
        />
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
