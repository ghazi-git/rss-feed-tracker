import { DeletionError, NotFoundError } from "@/background/utils/errors";
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { txDone } from "@/utils/idb-helpers";

/**
 * Delete the feed, its metadata and posts in the same transaction, then
 * update the unread count of parent folders if necessary (everything either
 * succeeds or fails together)
 * @raises DeletionError
 */
export async function deleteFeed(id: number) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(
    ["posts", "feedmetadata", "nodes"],
    "readwrite",
  );
  const postStore = tx.objectStore("posts");
  const feedmetadataStore = tx.objectStore("feedmetadata");
  const nodeStore = tx.objectStore("nodes");

  const feed = await nodeStore.get(id);
  if (!feed || feed.type !== "feed") {
    throw new NotFoundError(
      "Unable to find the feed, it may have been already deleted.",
      { cause: `feed-deletion: failure to find the feed id=${id}` },
    );
  }

  await Promise.all([
    postStore.delete(IDBKeyRange.bound([id], [id + 1], false, true)),
    feedmetadataStore.delete(id),
    nodeStore.delete(id),
  ]);

  if (feed.unreadCount) {
    await updateFeedUnreadCount(tx, feed.parentId, -feed.unreadCount);
  }
  try {
    await txDone(tx);
  } catch (e) {
    const msg = "Unable to delete the feed and its posts, please try again.";
    throw new DeletionError(msg, { cause: e });
  }
}
