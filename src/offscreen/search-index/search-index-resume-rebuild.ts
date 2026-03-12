import type { Document, IndexedDB } from "flexsearch";

import { ExtensionDB, getDBConnection, Post } from "@/db-setup";
import {
  SearchIndexProgressCursor,
  SearchIndexProgressParams,
  sendMessage,
} from "@/messaging-wrapper";
import { isPopupOpen } from "@/offscreen/utils";
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
 * - The reindexing process might take 75 to 90 minutes for 90K posts
 * - The reindexing progress is saved to the extension storage so that it's
 * possible to resume in case the browser is closed mid-indexing.
 */
export async function resumeRebuildingSearchIndex(
  params: SearchIndexProgressParams,
) {
  const logger = getLogger({ action: "resume-rebuild-search-index" });
  logger.debug("getting lock...");
  try {
    await navigator.locks.request(
      SEARCH_INDEX_REBUILDING_LOCK,
      { signal: AbortSignal.timeout(2000) },
      async () => {
        performance.mark("resume-reindexing");
        using conn = await getDBConnection();
        const isDone = await buildSearchIndex(conn.db, params, logger);
        if (isDone) {
          await finishRebuilding(
            params.indexName,
            params.initialCursor,
            logger,
          );
        }

        const res = performance.measure(
          "reindexing-duration",
          "resume-reindexing",
        );
        const msg = isDone ? "done" : "indexing paused";
        logger.debug(msg, { duration: `${res.duration.toFixed(1)} ms` });
      },
    );
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      logger.debug("aborted (cannot acquire a lock)");
    } else {
      logger.error("failure", e);
    }
  }
}

export async function buildSearchIndex(
  db: ExtensionDB,
  params: SearchIndexProgressParams,
  logger: Logger,
) {
  const index = await getSearchIndex(params.indexName);
  const batchSize = 100;
  const total = params.totalPostsToBeIndexed;
  let indexedSoFar = params.postsIndexedSoFar;
  let currentCursor = params.currentCursor;
  // signal if the indexing is actually done or if we're pausing the indexing
  // because the popup was opened
  let isDone = false;
  while (true) {
    const isOpen = await isPopupOpen();
    if (isOpen) break;

    const posts = await getPostsBatch(db, currentCursor, batchSize);
    await indexPosts(index, posts);
    indexedSoFar += posts.length;
    logger.debug("indexed posts", { indexedSoFar, total });

    if (posts.length < batchSize) {
      isDone = true;
      break;
    }
    const { fetchedAt, feedId, guid } = posts[posts.length - 1];
    currentCursor = { fetchedAt, feedId, guid };
    await saveRebuildingProgress({
      ...params,
      currentCursor,
      postsIndexedSoFar: indexedSoFar,
    });
  }

  return isDone;
}

async function getPostsBatch(
  db: ExtensionDB,
  cursor: SearchIndexProgressCursor,
  batchSize: number,
) {
  const query = IDBKeyRange.upperBound(
    [cursor.fetchedAt, cursor.feedId, cursor.guid],
    true,
  );
  // get data based on an index to minimize the chance of processing the same
  // posts more than once when rebuilding the index happens at the same time
  // as fetching new posts in the background
  return await db.getAllFromIndex("posts", "by_fetched_at_feed_id_guid", {
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
    const { feedId, guid, bookmarked, title } = post;
    const id = getIndexedPostID(feedId, guid);
    index.add({ id, feedId, title, bookmarked });
  }
  await index.commit();
}

async function saveRebuildingProgress(params: SearchIndexProgressParams) {
  // chrome.storage API is available in the service worker but not in
  // offscreen documents
  await sendMessage("search-index/store-rebuild-progress", params);
}

async function finishRebuilding(
  indexName: string,
  initialCursor: SearchIndexProgressCursor,
  logger: Logger,
) {
  logger.debug("indexing new posts since rebuilding start ...");
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
      logger.debug("deleting old index", { oldIndexName });
      const index = await getSearchIndex(oldIndexName);
      await index.destroy();
    }
  }
}
