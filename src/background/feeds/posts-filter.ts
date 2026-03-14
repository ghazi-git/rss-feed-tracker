import { listPosts } from "@/background/feeds/posts-list";
import { filterPosts } from "@/background/utils/filtering";
import { PostsView } from "@/messaging-wrapper";
import { FILTER_RESULTS_LIMIT, RECENT_POSTS_LIMIT } from "@/utils/settings";

export async function filterNodePosts(
  nodeId: number,
  query: string,
  postsView: PostsView,
) {
  if (!query) {
    const resp = await listPosts(nodeId, postsView, null, FILTER_RESULTS_LIMIT);
    return resp.posts.map((p) => ({ ...p, termPositions: [] }));
  }

  // fetch the latest 1k posts (i.e. recent), then filter them
  const resp = await listPosts(nodeId, postsView, null, RECENT_POSTS_LIMIT);
  return await filterPosts(resp.posts, query, FILTER_RESULTS_LIMIT);
}
