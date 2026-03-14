import type { Encoder } from "flexsearch";

import { ExtensionDB, getDBConnection } from "@/db-setup";
import {
  FeedPost,
  FilterResult,
  SearchQueryParams,
  TermPosition,
} from "@/messaging-wrapper";
import { getChildFeedIds } from "@/utils/nodes";
import { addFeedData } from "@/utils/posts";
import { getPostID, getSearchEncoder, getSearchIndex } from "@/utils/search";
import { SEARCH_RESULTS_LIMIT } from "@/utils/settings";

export async function querySearchIndex(
  params: SearchQueryParams,
  indexName: string,
) {
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
  const feedPosts = addFeedData(
    nodes.filter((n) => n.type === "feed"),
    posts,
  );

  // determine term positions for highlighting
  const postsWithHighlights = addTermPositions(params.query, feedPosts);

  // given that flexsearch already ranks the results by relevance, we will give
  // the first result, the highest score and go from there
  return postsWithHighlights.map((p, idx) => ({
    ...p,
    relevanceScore: SEARCH_RESULTS_LIMIT - idx,
  }));
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

function addTermPositions(query: string, posts: FeedPost[]): FilterResult[] {
  const encoder = getSearchEncoder();
  const searchTerms = encoder.encode(query);
  if (searchTerms.length === 0)
    return posts.map((p) => ({ ...p, termPositions: [] }));

  return posts.map((post) => {
    const { encoded, indexMap } = encodeText(encoder, post.title);
    if (!encoded.trim()) return { ...post, termPositions: [] };

    const termPositions = getTermPositions(searchTerms, encoded, indexMap);
    if (termPositions.length === 0) return { ...post, termPositions: [] };

    return { ...post, termPositions: mergeOverlappingPositions(termPositions) };
  });
}

function encodeText(encoder: Encoder, text: string) {
  let encodedText = "";
  const indexMap = [];
  for (let i = 0; i < text.length; i++) {
    const encoded = encoder.encode(text[i]);
    if (encoded.length === 0) {
      // Some characters (symbols, punctuation...) are skipped (i.e. encoded
      // is an empty array).So, we add a space (word boundary) to prevent term
      // matching across skipped characters given that encoded search terms
      // don't contain spaces
      encoded.push(" ");
    }
    for (const char of encoded) {
      encodedText += char;
      indexMap.push(i);
    }
  }

  return { encoded: encodedText, indexMap };
}

function getTermPositions(terms: string[], text: string, indexMap: number[]) {
  const positions: TermPosition[] = [];
  for (const term of terms) {
    let start = 0;
    let matchIdx: number;

    while ((matchIdx = text.indexOf(term, start)) > -1) {
      // positions will contain the start/end of the match in the original text
      positions.push({
        start: indexMap[matchIdx],
        end: indexMap[matchIdx + term.length - 1] + 1,
      });
      start = matchIdx + term.length;
    }
  }

  return positions;
}

function mergeOverlappingPositions(positions: TermPosition[]) {
  // sort by position start to make it easier to determine overlapping positions
  positions.sort((p1, p2) => p1.start - p2.start);

  const merged = [positions[0]];
  for (let i = 1; i < positions.length; i++) {
    const current = positions[i];
    const last = merged[merged.length - 1];

    // overlapping intervals or right after each other
    if (current.start <= last.end) {
      merged[merged.length - 1] = {
        start: last.start,
        end: Math.max(current.end, last.end),
      };
    } else {
      merged.push(current);
    }
  }

  return merged;
}

interface IndexSearchResult {
  id: string;
  doc: {
    feedId: number;
    bookmarked: 0 | 1;
  };
}
