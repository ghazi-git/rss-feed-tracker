import { useSearchParams } from "@solidjs/router";
import { createEffect, For, JSX, on } from "solid-js";

import { FilterResult, TermPosition } from "@/messaging-wrapper";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import Post from "@/popup/pages/node-posts/Post";
import { useToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { useToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import {
  createCommentShortcuts,
  createPostBookmarkShortcut,
  createPostLinkShortcuts,
  createPostUnreadShortcut,
} from "@/popup/utils/shortcuts";

export default function FilterResults(props: FilterResultsProps) {
  const posts = () => props.posts;
  const { focusedIndex, resetFocusedIndex } = useListNavigationContext();
  createCommentShortcuts(posts, focusedIndex);
  createPostLinkShortcuts(posts, focusedIndex);
  const { toggleBookmarked } = useToggleBookmarkedContext();
  createPostBookmarkShortcut(posts, focusedIndex, toggleBookmarked);
  const { toggleUnread } = useToggleUnreadContext();
  createPostUnreadShortcut(posts, focusedIndex, toggleUnread);
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
    <For each={posts()}>
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
}
