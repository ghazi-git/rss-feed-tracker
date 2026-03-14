import { createMemo, For, JSX } from "solid-js";

import { FilterResult, TermPosition } from "@/messaging-wrapper";
import Post from "@/popup/pages/node-posts/Post";
import { getGroupedPosts } from "@/popup/utils/posts";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

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

  return (
    <For each={groupedPosts()}>
      {(post) => (
        <Post post={post}>{highlightText(post.title, post.termPositions)}</Post>
      )}
    </For>
  );
}

function highlightText(text: string, positions: TermPosition[]) {
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
