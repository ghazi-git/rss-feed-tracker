import { ExtensionDB, getDBConnection } from "@/db-setup";
import { SearchQueryParams, SearchResult } from "@/messaging-wrapper";
import { getChildFeedIds } from "@/utils/nodes";
import { addFeedData } from "@/utils/posts";
import { getPostID, getSearchIndex } from "@/utils/search";
import { SEARCH_RESULTS_LIMIT } from "@/utils/settings";

export async function querySearchIndex(
  params: SearchQueryParams,
  indexName: string,
): Promise<SearchResult[]> {
  using conn = await getDBConnection();
  const nodes = await conn.db.getAll("nodes");
  const node = params.nodeId ? nodes.find((n) => n.id === params.nodeId) : null;

  const index = await getSearchIndex(indexName);

  const hasFilters = node?.parentId || params.bookmarked !== null;
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
  // when searching in the root folder (i.e. everywhere), no need to filter
  // the posts by feedIds
  if (node?.parentId) {
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
  return addFeedData(
    nodes.filter((n) => n.type === "feed"),
    posts,
  );
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
  };
}
