import { getChildFeedIds } from "@/background/utils/nodes";
import { addFeedData } from "@/background/utils/posts";
import { ExtensionDB, getDBConnection } from "@/db-setup";
import { SearchQueryParams, SearchResult } from "@/messaging-wrapper";
import { SearchIndexError } from "@/offscreen/errors";
import { OrderPostsBy } from "@/utils/extension-storage";
import { getPostID, getSearchIndex } from "@/utils/search";
import { SEARCH_RESULTS_LIMIT } from "@/utils/settings";

export async function querySearchIndex(
  params: SearchQueryParams,
  timeField: OrderPostsBy,
  indexName: string,
): Promise<SearchResult[]> {
  using conn = await getDBConnection();
  const nodes = await conn.db.getAll("nodes");
  const node = nodes.find((n) => n.id === params.nodeId);
  if (!node) {
    throw new SearchIndexError(
      "Unable to find the feed/folder, it may have been deleted.",
      { cause: `search: failure to get the node id=${params.nodeId}` },
    );
  }

  const index = await getSearchIndex(indexName);

  const hasFilters =
    node.parentId ||
    params.bookmarked !== null ||
    params.startDate !== null ||
    params.endDate !== null;
  let results = (await index.search({
    query: params.query,
    // if we have filters, get all the results then filter
    limit: hasFilters ? 1_000_000 : SEARCH_RESULTS_LIMIT,
    offset: 0,
    pluck: "title",
    enrich: true,
    suggest: true,
  })) as IndexSearchResult[];

  if (params.bookmarked !== null) {
    results = results.filter((res) => res.doc.bookmarked === params.bookmarked);
  }
  if (params.startDate !== null || params.endDate !== null) {
    results = filterByTime(
      results,
      timeField,
      params.startDate,
      params.endDate,
    );
  }
  // when searching in the root folder (i.e. everywhere), no need to filter
  // the posts by feedIds
  if (node.parentId) {
    const feedIds =
      node.type === "folder"
        ? getChildFeedIds(node, nodes)
        : new Set([node.id]);
    results = filterByFeedIds(results, feedIds);
  }
  // flexsearch doesn't always respect the limit set on the query
  // https://github.com/nextapps-de/flexsearch/issues/532
  results = results.slice(0, SEARCH_RESULTS_LIMIT);
  // fetch posts from db
  const posts = await getPostsFromDB(conn.db, results);
  const feedPosts = addFeedData(
    nodes.filter((n) => n.type === "feed"),
    posts,
  );

  // given that flexsearch already ranks the results by relevance, we will give
  // the first result, the highest score and go from there
  return feedPosts.map((p, idx) => ({
    ...p,
    relevanceScore: SEARCH_RESULTS_LIMIT - idx,
  }));
}

function filterByTime(
  results: IndexSearchResult[],
  timeField: OrderPostsBy,
  startDate: number | null,
  endDate: number | null,
) {
  if (startDate !== null && endDate !== null) {
    return results.filter(
      (r) => r.doc[timeField] >= startDate && r.doc[timeField] <= endDate,
    );
  } else if (startDate !== null) {
    return results.filter((r) => r.doc[timeField] >= startDate);
  } else if (endDate !== null) {
    return results.filter((r) => r.doc[timeField] <= endDate);
  }
  return results;
}

function filterByFeedIds(results: IndexSearchResult[], feedIds: Set<number>) {
  return results.filter((res) => {
    const postID = getPostID(res.id);
    return postID?.feedId && feedIds.has(postID.feedId);
  });
}

async function getPostsFromDB(db: ExtensionDB, results: IndexSearchResult[]) {
  const validPostIDs = results
    .map((res) => getPostID(res.id))
    .filter((id) => !!id);

  const tx = db.transaction(["posts"]);
  const store = tx.objectStore("posts");
  const promises = validPostIDs.map(({ feedId, guid }) =>
    store.get([feedId, guid]),
  );
  const posts = await Promise.all(promises);
  return posts.filter((p) => !!p);
}

interface IndexSearchResult {
  id: string;
  doc: {
    feedId: number;
    bookmarked: 0 | 1;
    receivedAt: number;
    publishedAt: number;
  };
}
