import { For, JSX } from "solid-js";

import { FilterResult, TermPosition } from "@/messaging-wrapper";
import Post from "@/popup/pages/node-posts/Post";

export default function FilterResults(props: FilterResultsProps) {
  return (
    <For each={props.posts}>
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
}
