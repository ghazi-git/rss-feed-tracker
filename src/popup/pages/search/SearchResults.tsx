import { useSearchParams } from "@solidjs/router";
import { createEffect, For, on } from "solid-js";

import { SearchResult } from "@/messaging-wrapper";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import Post from "@/popup/pages/node-posts/Post";
import { useToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { useToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import { highlightText } from "@/popup/pages/posts-filtering/FilterResults";
import { SearchPageParams } from "@/popup/utils/search";
import {
  createCommentShortcuts,
  createPostBookmarkShortcut,
  createPostLinkShortcuts,
  createPostUnreadShortcut,
} from "@/popup/utils/shortcuts";

export default function SearchResults(props: SearchResultsProps) {
  const posts = () => props.posts;
  const { focusedIndex, resetFocusedIndex } = useListNavigationContext();
  createCommentShortcuts(posts, focusedIndex);
  createPostLinkShortcuts(posts, focusedIndex);
  const { toggleBookmarked } = useToggleBookmarkedContext();
  createPostBookmarkShortcut(posts, focusedIndex, toggleBookmarked);
  const { toggleUnread } = useToggleUnreadContext();
  createPostUnreadShortcut(posts, focusedIndex, toggleUnread);
  // reset the focused index on query or sortBy changes
  const [searchParams] = useSearchParams<SearchPageParams>();
  createEffect(
    on(
      () => ({
        query: searchParams.query,
        sortBy: searchParams.sortBy,
      }),
      () => resetFocusedIndex(),
      { defer: true },
    ),
  );

  return (
    <For each={posts()}>
      {(post, index) => (
        <Post post={post} postIndex={index()}>
          {highlightText(post.title, post.termPositions)}
        </Post>
      )}
    </For>
  );
}

interface SearchResultsProps {
  posts: SearchResult[];
}
