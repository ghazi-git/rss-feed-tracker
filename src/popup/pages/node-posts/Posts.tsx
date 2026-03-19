import { useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, For, on, Show } from "solid-js";

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
  const { focusedIndex, resetFocusedIndex } = useListNavigationContext();
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
  // reset the focused index when moving between unread and all posts pages
  const [searchParams] = useSearchParams<{ unread?: string }>();
  createEffect(
    on(
      () => ({ unread: searchParams.unread }),
      () => resetFocusedIndex(),
      { defer: true },
    ),
  );

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
