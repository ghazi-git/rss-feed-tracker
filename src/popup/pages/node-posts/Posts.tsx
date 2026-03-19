import { createMemo, For, Show } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import PageSeparator from "@/popup/pages/node-posts/PageSeparator";
import Post from "@/popup/pages/node-posts/Post";
import PostsWrapper from "@/popup/pages/node-posts/PostsWrapper";
import { useToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { useToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import { getGroupedPosts } from "@/popup/utils/posts";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import {
  createCommentShortcuts,
  createPostBookmarkShortcut,
  createPostLinkShortcuts,
  createPostUnreadShortcut,
} from "@/popup/utils/shortcuts";
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
  const { focusedIndex } = useListNavigationContext();
  // eslint-disable-next-line solid/reactivity
  createCommentShortcuts(groupedPosts, focusedIndex);
  // eslint-disable-next-line solid/reactivity
  createPostLinkShortcuts(groupedPosts, focusedIndex);
  const { toggleBookmarked } = useToggleBookmarkedContext();
  // eslint-disable-next-line solid/reactivity
  createPostBookmarkShortcut(groupedPosts, focusedIndex, toggleBookmarked);
  const { toggleUnread } = useToggleUnreadContext();
  // eslint-disable-next-line solid/reactivity
  createPostUnreadShortcut(groupedPosts, focusedIndex, toggleUnread);

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
