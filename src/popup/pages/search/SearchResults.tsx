import { For } from "solid-js";

import { SearchResult } from "@/messaging-wrapper";
import Post from "@/popup/pages/node-posts/Post";
import { highlightText } from "@/popup/pages/posts-filtering/FilterResults";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { useSortBy } from "@/popup/utils/search";

export default function SearchResults(props: SearchResultsProps) {
  const sortBy = useSortBy();
  const { preferences } = usePreferencesContext();
  const sortedPosts = () => {
    const sortField = preferences.orderPostsBy;
    if (sortBy() === "time_desc") {
      return props.posts.toSorted((a, b) => b[sortField] - a[sortField]);
    } else if (sortBy() === "time_asc") {
      return props.posts.toSorted((a, b) => a[sortField] - b[sortField]);
    } else {
      return props.posts.toSorted(
        (a, b) => b.relevanceScore - a.relevanceScore,
      );
    }
  };

  return (
    <For each={sortedPosts()}>
      {(post) => (
        <Post post={post}>{highlightText(post.title, post.termPositions)}</Post>
      )}
    </For>
  );
}

interface SearchResultsProps {
  posts: SearchResult[];
}
