import { NotFoundError } from "@/background/utils/errors";
import { getChildFeedIds } from "@/background/utils/nodes";
import { addFeedData } from "@/background/utils/posts";
import { ExtensionDB, getDBConnection, TreeNode } from "@/db-setup";
import { SearchQueryParams, SearchResult } from "@/messaging-wrapper";
import { OrderPostsBy } from "@/utils/extension-storage";
import { getPostID, getSearchIndex } from "@/utils/search";
import { SEARCH_RESULTS_LIMIT } from "@/utils/settings";

export async function querySearchIndex(
  params: SearchQueryParams,
  timeField: OrderPostsBy,
): Promise<SearchResult[]> {
  using conn = await getDBConnection();
  const nodes = await conn.db.getAll("nodes");
  const node = nodes.find((n) => n.id === params.nodeId);
  if (!node) {
    throw new NotFoundError(
      "Unable to find the feed/folder, it may have been deleted.",
      { cause: `search: failure to get the node id=${params.nodeId}` },
    );
  }

  const feedIds = getFeedIds(node, nodes);
  const tags = getTags(feedIds, params.bookmarked);
  const filterByTime = params.startDate !== null || params.endDate !== null;
  const index = await getSearchIndex();

  // @ts-expect-error tag accepts an array of values per its docs
  // https://github.com/nextapps-de/flexsearch/blob/master/doc/document-search.md#tags
  const results = (await index.search({
    query: params.query,
    // if we filter by time, get more results then, filter by time
    limit: filterByTime ? 1000 : SEARCH_RESULTS_LIMIT,
    offset: 0,
    pluck: "title",
    enrich: true,
    tag: tags,
    // default typing is wrong due to the above ts-expect-error
  })) as unknown as IndexSearchResult[];

  // apply the time filter if any is provided
  const filteredResults = filterResultsByTime(
    results,
    timeField,
    params.startDate,
    params.endDate,
  );
  // flexsearch doesn't always respect the limit set on the query
  // https://github.com/nextapps-de/flexsearch/issues/532
  const limitedResults = filteredResults.slice(0, SEARCH_RESULTS_LIMIT);
  // fetch posts from db
  const posts = await getPostsFromDB(conn.db, limitedResults);
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

function getFeedIds(node: TreeNode, nodes: TreeNode[]) {
  // when searching in the root folder (i.e. everywhere), don't return any
  // feed ID. That means that the search will not add a feedId tag
  if (!node.parentId) return [];

  if (node.type === "feed") return [node.id];

  return [...getChildFeedIds(node, nodes)];
}

function getTags(
  feedIds: number[],
  bookmarked: 0 | 1 | null,
): Tags | undefined {
  if (feedIds.length && bookmarked !== null) {
    return { bookmarked, feedId: feedIds };
  } else if (feedIds.length) {
    return { feedId: feedIds };
  } else if (bookmarked !== null) {
    return { bookmarked };
  }
}

function filterResultsByTime(
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
  doc: { receivedAt: number; publishedAt: number };
}

type Tags =
  | { bookmarked: 0 | 1 }
  | { feedId: number[] }
  | { bookmarked: 0 | 1; feedId: number[] };
