import { unwrap } from "idb";

import { getDBConnection } from "@/background/db-setup";
import { FeedDeletionError } from "@/background/utils/errors";
import { txDone } from "@/background/utils/idb-helpers";

/**
 * Delete the feed, its metadata and posts in the same transaction (everything
 * either succeeds or fails together)
 * @raises FeedDeletionError
 */
export async function deleteFeed(id: number) {
  using conn = await getDBConnection();
  const tx = unwrap(
    conn.db.transaction(["posts", "feedmetadata", "nodes"], "readwrite"),
  );
  const posts = tx.objectStore("posts");
  posts.delete(IDBKeyRange.bound([id], [id + 1], false, true));

  const feedmetadata = tx.objectStore("feedmetadata");
  feedmetadata.delete(id);

  const nodes = tx.objectStore("nodes");
  nodes.delete(id);

  try {
    await txDone(tx);
  } catch (e) {
    const msg = "Unable to delete the feed and its posts, please try again.";
    throw new FeedDeletionError(msg, { cause: e });
  }
}
