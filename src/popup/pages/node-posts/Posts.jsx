import { createSignal, For, onMount } from "solid-js";

import BookmarkToggle from "@/popup/pages/node-posts/BookmarkToggle.jsx";
import PostMetadata from "@/popup/pages/node-posts/PostMetadata.jsx";
import UnreadToggle from "@/popup/pages/node-posts/UnreadToggle.jsx";

import styles from "./Posts.module.css";

export default function Posts(props) {
  return (
    <div class={styles.posts}>
      <For each={props.posts}>{(post) => <Post post={post} />}</For>
    </div>
  );
}

function Post(props) {
  const [showTooltip, setSowTooltip] = createSignal(false);
  let titleRef;
  onMount(() => {
    if (titleRef.scrollHeight > titleRef.clientHeight) {
      setSowTooltip(true);
    }
  });

  return (
    <div class={styles.post}>
      <div
        ref={titleRef}
        title={showTooltip() ? props.post.title : ""}
        class={styles.title}
        dir="auto"
      >
        {props.post.title}
      </div>
      <div class={styles.footer}>
        <PostMetadata
          feedName={props.post.feed.name}
          feedFavicon={props.post.feed.favicon}
          publishedAt={props.post.publishedAt}
        />
        <div class={styles.actions}>
          <BookmarkToggle bookmarked={props.post.bookmarked} />
          <UnreadToggle unread={props.post.unread} />
        </div>
      </div>
    </div>
  );
}
