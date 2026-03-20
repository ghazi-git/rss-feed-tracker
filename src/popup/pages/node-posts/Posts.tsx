import { useSearchParams } from "@solidjs/router";
import { createEffect, For, on, Show } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import PageSeparator from "@/popup/pages/node-posts/PageSeparator";
import Post from "@/popup/pages/node-posts/Post";
import PostsWrapper from "@/popup/pages/node-posts/PostsWrapper";
import { useToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { useToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import {
  createCommentShortcuts,
  createPostBookmarkShortcut,
  createPostLinkShortcuts,
  createPostUnreadShortcut,
} from "@/popup/utils/shortcuts";
import { PAGE_SIZE } from "@/utils/settings";

export default function Posts(props: PostsProps) {
  const posts = () => props.posts;
  const { focusedIndex, resetFocusedIndex } = useListNavigationContext();
  createCommentShortcuts(posts, focusedIndex);
  createPostLinkShortcuts(posts, focusedIndex);
  const { toggleBookmarked } = useToggleBookmarkedContext();
  createPostBookmarkShortcut(posts, focusedIndex, toggleBookmarked);
  const { toggleUnread } = useToggleUnreadContext();
  createPostUnreadShortcut(posts, focusedIndex, toggleUnread);
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
      <For each={posts()}>
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
