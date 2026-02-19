import type { Document, IndexedDB } from "flexsearch";

import { ExtensionDB, getDBConnection, Post } from "@/db-setup";
import {
  SearchIndexProgressCursor,
  SearchIndexProgressParams,
  sendMessage,
} from "@/messaging-wrapper";
import { getLogger, Logger } from "@/utils/logging";
import { getIndexedPostID, getSearchIndex, IndexedPost } from "@/utils/search";
import { SEARCH_INDEX_REBUILDING_LOCK } from "@/utils/settings";

/**
 * A new search index is built while the extension continues to use the old one
 * (user queries during index rebuilding run against the old index).
 * Once the rebuilding is done, we point the searchIndexName in the extension
 * storage to the new index and then delete the old index.
 *
 * Notes:
 * - We use a lock to avoid building multiple indexes concurrently (the index
 * size for 90K posts is around 1 GB according to `navigator.storage.estimate`)
 * - The reindexing process might take up to 90 minutes for 90K posts
 * - The reindexing progress is saved to the extension storage so that it's
 * possible to resume in case the browser is closed mid-indexing.
 */
export async function rebuildSearchIndex() {
  const logger = getLogger({ action: "rebuild-search-index" });
  logger.debug("getting lock...");
  try {
    navigator.locks.request(
      SEARCH_INDEX_REBUILDING_LOCK,
      { signal: AbortSignal.timeout(2000) },
      async () => {
        performance.mark("reindexing-start");
        using conn = await getDBConnection();
        const latestPost = await getLatestPost(conn.db);
        if (!latestPost) {
          logger.debug("no posts to reindex.");
          return;
        }

        const indexName = `search-index-${Date.now()}`;
        const startTime = Date.now();
        const { receivedAt, feedId, guid } = latestPost;
        const initialCursor = { receivedAt, feedId, guid };
        const currentCursor = initialCursor;
        const params = { indexName, startTime, initialCursor, currentCursor };
        await saveRebuildingProgress(params);
        logger.debug("start reindexing", params);
        await buildSearchIndex(conn.db, params, logger);
        await finishRebuilding(indexName, initialCursor);

        const res = performance.measure(
          "reindexing-duration",
          "reindexing-start",
        );
        logger.debug("done", { duration: `${res.duration.toFixed(1)} ms` });
      },
    );
  } catch (e) {
    logger.error("failure", e);
  }
}

async function getLatestPost(db: ExtensionDB) {
  const posts = await db.getAllFromIndex(
    "posts",
    "by_received_at_feed_id_guid",
    { count: 1 },
  );
  return posts.length ? posts[0] : null;
}

async function saveRebuildingProgress(params: SearchIndexProgressParams) {
  // chrome.storage API is available in the service worker but not in
  // offscreen documents
  await sendMessage("search-index/store-rebuild-progress", params);
}

export async function buildSearchIndex(
  db: ExtensionDB,
  params: SearchIndexProgressParams,
  logger: Logger,
) {
  const index = await getSearchIndex(params.indexName);
  const batchSize = 1_000;
  let loop = 0;
  let currentCursor = params.currentCursor;
  while (true) {
    const posts = await getPostsBatch(db, currentCursor, batchSize);
    await indexPosts(index, posts);
    const indexedSoFar = loop * batchSize + posts.length;
    logger.debug("indexed posts", { indexedSoFar });

    if (posts.length < batchSize) break;
    const { receivedAt, feedId, guid } = posts[posts.length - 1];
    currentCursor = { receivedAt, feedId, guid };
    await saveRebuildingProgress({ ...params, currentCursor });
    loop++;
  }
}

async function getPostsBatch(
  db: ExtensionDB,
  cursor: SearchIndexProgressCursor,
  batchSize: number,
) {
  const query = IDBKeyRange.upperBound(
    [cursor.receivedAt, cursor.feedId, cursor.guid],
    true,
  );
  // get data based on an index to minimize the chance of processing the same
  // posts more than once when rebuilding the index happens at the same time
  // as fetching new posts in the background
  return await db.getAllFromIndex("posts", "by_received_at_feed_id_guid", {
    query,
    direction: "prev",
    count: batchSize,
  });
}

async function indexPosts(
  index: Document<IndexedPost, false, IndexedDB>,
  posts: Post[],
) {
  for (const post of posts) {
    const { feedId, guid, receivedAt, bookmarked, title, publishedAt } = post;
    const id = getIndexedPostID(feedId, guid);
    index.add({ id, feedId, title, bookmarked, publishedAt, receivedAt });
  }
  await index.commit();
}

export async function finishRebuilding(
  indexName: string,
  initialCursor: SearchIndexProgressCursor,
) {
  // notify the service worker to finish the rebuilding process:
  // - schedule for indexing any new posts since rebuilding start
  // - swap the old and new indexes
  // the process is finished in the service worker because it requires
  // APIs available only there (alarms, storage)
  const resp = await sendMessage("search-index/finish-rebuild", {
    indexName,
    initialCursor,
  });
  if (resp.success) {
    const oldIndexName = resp.data;
    if (oldIndexName) {
      const index = await getSearchIndex(oldIndexName);
      await index.destroy();
    }
  }
}
