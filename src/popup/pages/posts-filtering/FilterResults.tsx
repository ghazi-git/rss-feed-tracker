import { For } from "solid-js";

import { FilterResult } from "@/messaging-wrapper";
import Post from "@/popup/pages/node-posts/Post";

export default function FilterResults(props: FilterResultsProps) {
  return (
    <For each={props.posts}>
      {(post) => (
        <Post post={post}>{highlightText(post.title, post.termPosition)}</Post>
      )}
    </For>
  );
}

function highlightText(
  text: string,
  position: { start: number; end: number } | null,
) {
  if (!position) return text;

  const before = text.substring(0, position.start);
  const term = text.substring(position.start, position.end);
  const after = text.substring(position.end);
  return (
    <>
      {before}
      <mark>{term}</mark>
      {after}
    </>
  );
}

interface FilterResultsProps {
  posts: FilterResult[];
}
