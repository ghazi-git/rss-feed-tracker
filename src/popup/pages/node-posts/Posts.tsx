import { createMemo, For, Show } from "solid-js";

import { getChunks } from "@/background/utils/chunks";
import { FeedPost } from "@/messaging-wrapper";
import { PostMenuProvider } from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import Post from "@/popup/pages/node-posts/Post";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { PAGE_SIZE } from "@/utils/settings";

import styles from "./Posts.module.css";

export default function Posts(props: PostsProps) {
  const { preferences } = usePreferencesContext();
  const groupPosts = () => props.isFolder && preferences.groupFolderPosts;
  const groupedPosts = createMemo((prev: FeedPost[]) => {
    if (groupPosts()) {
      const lastSlice = props.posts.slice(prev.length);
      const orderedSlice = getGroupedPosts(
        lastSlice,
        preferences.orderPostsBy === "receivedAt",
      );
      return [...prev, ...orderedSlice];
    } else {
      return props.posts;
    }
  }, []);

  return (
    <PostMenuProvider>
      <PostContextMenu />
      <div class={styles.posts}>
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
              <Post post={post} />
            </>
          )}
        </For>
      </div>
    </PostMenuProvider>
  );
}

function getGroupedPosts(posts: FeedPost[], orderByReceivedAt: boolean) {
  // we can have more than PAGE_SIZE of posts when the posts page is the last
  // page visited by the user and they were viewing more than 1 page of posts
  const chunks = getChunks(posts, PAGE_SIZE);
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const result: FeedPost[] = [];
  for (const chunk of chunks) {
    chunk.sort((p1, p2) => {
      const res = collator.compare(p1.feedName, p2.feedName);
      if (res !== 0) return res;

      return orderByReceivedAt
        ? p2.receivedAt - p1.receivedAt
        : p2.publishedAt - p1.publishedAt;
    });
    result.push(...chunk);
  }
  return result;
}

interface PostsProps {
  posts: FeedPost[];
  isFolder: boolean;
}
