import {
  getSearchIndexName,
  removeSearchIndexRebuildingProgress,
  saveSearchIndexName,
} from "@/background/utils/search";
import { getDBConnection, ReadWriteTX, SearchIndexAdd } from "@/db-setup";
import { SearchIndexProgressCursor } from "@/messaging-wrapper";
import { getAllFromIndex, txDone } from "@/utils/idb-helpers";
import { getSearchIndex } from "@/utils/search";

export async function finishRebuildingSearchIndex(
  indexName: string,
  initialCursor: SearchIndexProgressCursor,
) {
  using conn = await getDBConnection();
  // getting a read-write transaction means that no one else is accessing the
  // stores once the transaction starts. That allows coordinating the swap from
  // the old to the new search index without worrying about incoming posts
  const tx = conn.db.transaction(
    ["posts", "searchIndexOperations"],
    "readwrite",
  );
  const newPosts = await getNewPostsSinceRebuildStart(tx, initialCursor);
  // clear any existing indexing operation since they are meant for the old
  // index, then schedule new ones for the new index
  const operations = tx.objectStore("searchIndexOperations");
  await operations.clear();
  for (const post of newPosts) {
    operations.add({
      createdAt: Date.now(),
      feedId: post.feedId,
      guid: post.guid,
      operation: "add",
      document: {
        title: post.title,
        bookmarked: post.bookmarked,
        receivedAt: post.receivedAt,
        publishedAt: post.publishedAt,
      },
    } as SearchIndexAdd);
  }
  await txDone(tx);

  // swap the indexes and delete the old one
  const oldIndexName = await getSearchIndexName();
  await saveSearchIndexName(indexName);
  await removeSearchIndexRebuildingProgress();
  if (oldIndexName) {
    const index = await getSearchIndex(oldIndexName);
    await index.destroy();
  }
}

async function getNewPostsSinceRebuildStart(
  tx: ReadWriteTX,
  initialCursor: SearchIndexProgressCursor,
) {
  const query = IDBKeyRange.lowerBound([
    initialCursor.receivedAt,
    initialCursor.feedId,
    initialCursor.guid,
  ]);
  return await getAllFromIndex(tx, "posts", "by_received_at_feed_id_guid", {
    query,
  });
}
