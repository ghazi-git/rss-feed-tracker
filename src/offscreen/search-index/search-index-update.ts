import type { Document, IndexedDB } from "flexsearch";

import { ExtensionDB, getDBConnection, SearchIndexOperation } from "@/db-setup";
import { getLogger } from "@/utils/logging";
import { getIndexedPostID, getSearchIndex, IndexedPost } from "@/utils/search";
import { SEARCH_INDEXING_LOCK } from "@/utils/settings";

export async function updateSearchIndex(indexName: string) {
  const logger = getLogger({ action: "update-search-index" });
  logger.debug("getting lock...");
  // the lock guarantees that one process is indexing to avoid applying
  // operations out of order
  try {
    navigator.locks.request(
      SEARCH_INDEXING_LOCK,
      { signal: AbortSignal.timeout(2000) },
      async () => {
        performance.mark("indexing");
        using conn = await getDBConnection();
        const index = await getSearchIndex(indexName);

        const batchSize = 100;
        let loop = 0;
        let lastID: number | null = null;
        while (true) {
          const operations = await getOperations(conn.db, lastID, batchSize);
          if (operations.length) {
            await applyOperations(index, operations);
            lastID = operations[operations.length - 1].id;
            await markOperationsApplied(conn.db, lastID);
            const appliedSoFar = loop * batchSize + operations.length;
            logger.debug("applied operations", { appliedSoFar });
          }

          if (operations.length < batchSize) break;
          loop++;
        }
        const res = performance.measure("indexing-duration", "indexing");
        logger.debug("done", { duration: `${res.duration.toFixed(1)} ms` });
      },
    );
  } catch (e) {
    logger.error("failure", e);
  }
}

async function getOperations(
  db: ExtensionDB,
  cursor: number | null,
  batchSize: number,
) {
  const query = cursor ? IDBKeyRange.lowerBound(cursor, true) : undefined;
  return db.getAll("searchIndexOperations", { query, count: batchSize });
}

async function applyOperations(
  index: Document<IndexedPost, false, IndexedDB>,
  operations: SearchIndexOperation[],
) {
  operations.forEach((op) => {
    const docID = getIndexedPostID(op.feedId, op.guid);
    if (op.operation === "remove") {
      index.remove(docID);
    } else if (op.operation === "update") {
      index.update({
        id: docID,
        title: op.document.title,
        feedId: op.feedId,
        bookmarked: op.document.bookmarked,
        publishedAt: op.document.publishedAt,
        fetchedAt: op.document.fetchedAt,
      });
    } else {
      index.add({
        id: docID,
        title: op.document.title,
        feedId: op.feedId,
        bookmarked: op.document.bookmarked,
        publishedAt: op.document.publishedAt,
        fetchedAt: op.document.fetchedAt,
      });
    }
  });

  await index.commit();
}

async function markOperationsApplied(db: ExtensionDB, lastOperationID: number) {
  await db.delete(
    "searchIndexOperations",
    IDBKeyRange.upperBound(lastOperationID),
  );
}
