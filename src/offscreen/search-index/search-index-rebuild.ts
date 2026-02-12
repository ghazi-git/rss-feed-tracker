import { ExtensionDB, getDBConnection, Post } from "@/db-setup";
import { getIndexedPostID, getSearchIndex } from "@/utils/search";

export async function rebuildSearchIndex() {
  // delete the search index and create it again (faster than clearing it)
  let index = await getSearchIndex();
  await index.destroy();
  index = await getSearchIndex();

  using conn = await getDBConnection();

  const batchSize = 1_000;
  let cursor: Post | null = null;
  while (true) {
    const posts = await getPostsBatch(conn.db, cursor, batchSize);
    for (const post of posts) {
      const { feedId, guid, receivedAt, bookmarked, title, publishedAt } = post;
      const id = getIndexedPostID(feedId, guid);
      index.add({ id, feedId, title, bookmarked, publishedAt, receivedAt });
    }
    await index.commit();

    if (posts.length < batchSize) break;
    cursor = posts[posts.length - 1];
  }
}

async function getPostsBatch(
  db: ExtensionDB,
  cursor: Post | null,
  batchSize: number,
) {
  const query = cursor
    ? IDBKeyRange.upperBound(
        [cursor.receivedAt, cursor.feedId, cursor.guid],
        true,
      )
    : null;
  // get data based on an index to minimize the chance of processing the same
  // posts more than once when rebuilding the index happens at the same time
  // as fetching new posts in the background
  return await db.getAllFromIndex("posts", "by_received_at_feed_id_guid", {
    query,
    direction: "prev",
    count: batchSize,
  });
}
