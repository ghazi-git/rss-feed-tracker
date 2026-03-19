import { useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, For, JSX, on } from "solid-js";

import { FilterResult, TermPosition } from "@/messaging-wrapper";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import Post from "@/popup/pages/node-posts/Post";
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

export default function FilterResults(props: FilterResultsProps) {
  const { preferences } = usePreferencesContext();
  const groupedPosts = createMemo(() => {
    const feedIds = new Set(props.posts.map((p) => p.feedId));
    if (!props.query && preferences.groupFolderPosts && feedIds.size > 1) {
      // grouping is done only when there is no query. That is to keep posts
      // ordering the same when going from the posts page to the filtering page
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
  // reset the focused index on query changes
  const [searchParams] = useSearchParams<{ query?: string }>();
  createEffect(
    on(
      () => ({ query: searchParams.query }),
      () => resetFocusedIndex(),
      { defer: true },
    ),
  );

  return (
    <For each={groupedPosts()}>
      {(post, index) => (
        <Post post={post} postIndex={index()}>
          {highlightText(post.title, post.termPositions)}
        </Post>
      )}
    </For>
  );
}

export function highlightText(text: string, positions: TermPosition[]) {
  if (positions.length === 0) return text;

  const output: JSX.Element[] = [];
  let startIdx = 0;
  for (const pos of positions) {
    output.push(text.substring(startIdx, pos.start));
    output.push(<mark>{text.substring(pos.start, pos.end)}</mark>);
    startIdx = pos.end;
  }
  output.push(text.substring(startIdx));

  return (
    <For each={output.filter((elt) => !!elt)}>{(fragment) => fragment}</For>
  );
}

interface FilterResultsProps {
  posts: FilterResult[];
  query: string;
}
