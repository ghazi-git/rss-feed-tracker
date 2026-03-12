import { For } from "solid-js";

import { SearchResult } from "@/messaging-wrapper";
import Post from "@/popup/pages/node-posts/Post";

export default function SearchResults(props: { posts: SearchResult[] }) {
  return <For each={props.posts}>{(post) => <Post post={post} />}</For>;
}
