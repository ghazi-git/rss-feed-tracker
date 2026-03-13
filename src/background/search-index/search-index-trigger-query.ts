import { getBookmarks } from "@/background/feeds/posts-get-bookmarks";
import { listPosts } from "@/background/feeds/posts-list";
import { TriggerQuerySearchIndex } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { getSearchIndexName } from "@/background/utils/search";
import { SearchQueryParams, sendMessage } from "@/messaging-wrapper";
import { SEARCH_RESULTS_LIMIT } from "@/utils/settings";

export async function triggerSearchQuery(params: SearchQueryParams) {
  if (!params.query) {
    const nodeId = params.nodeId;
    if (nodeId) {
      const resp = await listPosts(nodeId, "all", null, SEARCH_RESULTS_LIMIT);
      return resp.posts.map((p) => ({ ...p, termPositions: [] }));
    } else if (params.bookmarked) {
      const resp = await getBookmarks("all", null, SEARCH_RESULTS_LIMIT);
      return resp.posts.map((p) => ({ ...p, termPositions: [] }));
    } else {
      return [];
    }
  }

  await setupOffscreenDocument("Query the search index");

  const indexName = await getSearchIndexName();
  if (!indexName) {
    throw new TriggerQuerySearchIndex(
      "No search index found. Please go to 'Preferences' and click the 'Rebuild Search Index' button.",
    );
  }

  const response = await sendMessage("search-index/query", {
    ...params,
    indexName,
  });
  if (!response.success) {
    throw new TriggerQuerySearchIndex(response.errorMsg);
  }

  return response.data;
}
