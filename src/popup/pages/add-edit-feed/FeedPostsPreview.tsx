import { For, Show } from "solid-js";

import { PostPreview } from "@/messaging-wrapper";
import { FeedPostPreview } from "@/popup/pages/add-edit-feed/FeedPostPreview";

import styles from "./FeedPostsPreview.module.css";

export default function FeedPostsPreview(props: { posts: PostPreview[] }) {
  return (
    <Show
      when={props.posts.length > 0}
      fallback={<h4 class={styles["no-posts"]}>The feed has no posts yet.</h4>}
    >
      <div class={styles.preview}>
        <h4 class={styles["latest-posts"]}>Latest Posts:</h4>
        <For each={props.posts}>
          {(post) => (
            <FeedPostPreview
              title={post.title}
              url={post.url}
              publishedAt={post.publishedAt}
            />
          )}
        </For>
      </div>
    </Show>
  );
}
