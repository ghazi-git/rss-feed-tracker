import { createMemo, For, Show } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import { PostMenuProvider } from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import Post from "@/popup/pages/node-posts/Post";
import { getGroupedPosts } from "@/popup/utils/posts";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { PAGE_SIZE } from "@/utils/settings";

import styles from "./Posts.module.css";

export default function Posts(props: PostsProps) {
  const { preferences } = usePreferencesContext();
  const groupPosts = () => props.isFolder && preferences.groupFolderPosts;
  const groupedPosts = createMemo(() => {
    if (groupPosts()) {
      const orderByFetchedAt = preferences.orderPostsBy === "fetchedAt";
      return getGroupedPosts(props.posts, orderByFetchedAt);
    } else {
      return props.posts;
    }
  });

  return (
    <PostMenuProvider>
      <PostContextMenu />
      <div class={styles.posts} role="list">
        <For each={groupedPosts()}>
          {(post, index) => (
            <>
              <Show
                when={groupPosts() && index() > 0 && index() % PAGE_SIZE === 0}
              >
                <div class={styles.title}>
                  Page {Math.floor(index() / PAGE_SIZE) + 1}
                </div>
              </Show>
              <Post post={post} postIndex={index()} />
            </>
          )}
        </For>
      </div>
    </PostMenuProvider>
  );
}

interface PostsProps {
  posts: FeedPost[];
  isFolder: boolean;
}
