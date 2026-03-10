import { listPosts } from "@/background/feeds/posts-list";
import { filterPosts } from "@/background/utils/filtering";
import { RECENT_POSTS_LIMIT, SEARCH_RESULTS_LIMIT } from "@/utils/settings";

export async function filterNodePosts(nodeId: number, query: string) {
  if (!query) {
    const resp = await listPosts(nodeId, "all", null, SEARCH_RESULTS_LIMIT);
    return resp.posts.map((p) => ({ ...p, termPosition: null }));
  }

  // fetch the latest 1k posts (i.e. recent), then filter them
  const resp = await listPosts(nodeId, "all", null, RECENT_POSTS_LIMIT);
  return await filterPosts(resp.posts, query, SEARCH_RESULTS_LIMIT);
}
