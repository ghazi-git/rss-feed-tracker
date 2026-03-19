import { createMemo, For, Show } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import PageSeparator from "@/popup/pages/node-posts/PageSeparator";
import Post from "@/popup/pages/node-posts/Post";
import PostsWrapper from "@/popup/pages/node-posts/PostsWrapper";
import { getGroupedPosts } from "@/popup/utils/posts";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { PAGE_SIZE } from "@/utils/settings";

export default function Posts(props: PostsProps) {
  const { preferences } = usePreferencesContext();
  const groupedPosts = createMemo(() => {
    if (props.groupPosts) {
      const orderByFetchedAt = preferences.orderPostsBy === "fetchedAt";
      return getGroupedPosts(props.posts, orderByFetchedAt);
    } else {
      return props.posts;
    }
  });

  return (
    <PostsWrapper>
      <For each={groupedPosts()}>
        {(post, index) => (
          <>
            <Show
              when={
                props.groupPosts && index() > 0 && index() % PAGE_SIZE === 0
              }
            >
              <PageSeparator page={Math.floor(index() / PAGE_SIZE) + 1} />
            </Show>
            <Post post={post} postIndex={index()} />
          </>
        )}
      </For>
    </PostsWrapper>
  );
}

interface PostsProps {
  posts: FeedPost[];
  groupPosts: boolean;
}
