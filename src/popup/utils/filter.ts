import { useSearchParams } from "@solidjs/router";
import { createMemo, Resource } from "solid-js";

import { FilterResult } from "@/messaging-wrapper";
import { getGroupedPosts } from "@/popup/utils/posts";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

export function useGroupedFilterResults(posts: Resource<FilterResult[]>) {
  const [searchParams] = useSearchParams<{ query?: string }>();
  const { preferences } = usePreferencesContext();

  const groupedResults = createMemo(() => {
    if (!posts.latest) return posts.latest;

    const results = posts.latest;
    const feedIds = new Set(results.map((p) => p.feedId));
    if (
      !searchParams.query &&
      preferences.groupFolderPosts &&
      feedIds.size > 1
    ) {
      // grouping is done only when there is no query. That is to keep posts
      // ordering the same when going from the posts page to the filtering page
      const orderByFetchedAt = preferences.orderPostsBy === "fetchedAt";
      return getGroupedPosts(results, orderByFetchedAt);
    } else {
      return results;
    }
  });
  return groupedResults;
}
