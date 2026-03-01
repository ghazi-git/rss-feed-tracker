import { TriggerRebuildSearchIndex } from "@/background/utils/errors";
import {
  isRebuildingAlreadyScheduled,
  saveSearchIndexRebuildingProgress,
} from "@/background/utils/search";
import { ExtensionDB, getDBConnection, Post } from "@/db-setup";

export async function triggerRebuildSearchIndex() {
  const isScheduled = await isRebuildingAlreadyScheduled();
  if (isScheduled)
    throw new TriggerRebuildSearchIndex(
      "Search index rebuilding is already scheduled.",
    );

  using conn = await getDBConnection();
  const latestPost = await getLatestPost(conn.db);
  if (!latestPost)
    throw new TriggerRebuildSearchIndex("There are no posts to index.");

  // store search index rebuilding params in extension storage as an indication
  // that the rebuilding was scheduled. Later when the popup is closed, the
  // index rebuilding will actually start.
  const { fetchedAt, feedId, guid } = latestPost;
  const initialCursor = { fetchedAt, feedId, guid };
  const startTime = Date.now();
  const totalPostsToBeIndexed = await getTotalPosts(conn.db, latestPost);
  const params = {
    indexName: `search-index-${startTime}`,
    startTime,
    postsIndexedSoFar: 0,
    totalPostsToBeIndexed,
    initialCursor,
    currentCursor: initialCursor,
  };
  await saveSearchIndexRebuildingProgress(params);
}

async function getLatestPost(db: ExtensionDB) {
  const posts = await db.getAllFromIndex(
    "posts",
    "by_fetched_at_feed_id_guid",
    { count: 1, direction: "prev" },
  );
  return posts.length ? posts[0] : null;
}

async function getTotalPosts(db: ExtensionDB, latestPost: Post) {
  const query = IDBKeyRange.upperBound(
    [latestPost.fetchedAt, latestPost.feedId, latestPost.guid],
    true,
  );

  return await db.countFromIndex("posts", "by_fetched_at_feed_id_guid", query);
}
