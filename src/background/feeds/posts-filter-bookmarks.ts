import { getBookmarks } from "@/background/feeds/posts-get-bookmarks";
import { filterPosts } from "@/background/utils/filtering";
import { RECENT_POSTS_LIMIT, SEARCH_RESULTS_LIMIT } from "@/utils/settings";

export async function filterBookmarks(query: string) {
  if (!query) {
    const resp = await getBookmarks("all", null, SEARCH_RESULTS_LIMIT);
    return resp.posts;
  }

  // fetch the latest 1k posts (i.e. recent), then filter them
  const resp = await getBookmarks("all", null, RECENT_POSTS_LIMIT);
  return await filterPosts(resp.posts, query, SEARCH_RESULTS_LIMIT);
}
