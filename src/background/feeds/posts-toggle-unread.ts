import { unwrap } from "idb";

import { NotFoundError } from "@/background/utils/errors";
import { txDone } from "@/background/utils/idb-helpers";
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";

export async function toggleUnreadPost(
  feedId: number,
  guid: string,
  unread: boolean,
) {
  using conn = await getDBConnection();

  const tx = conn.db.transaction(["posts", "nodes"], "readwrite");

  const postStore = tx.objectStore("posts");
  const post = await postStore.get([feedId, guid]);
  if (!post) {
    const msg = "Unable to find the post, it may have been deleted.";
    throw new NotFoundError(msg);
  }
  post.unread = unread ? 1 : 0;
  await postStore.put(post);

  // update the unread count of parent folders
  await updateFeedUnreadCount(tx, feedId, unread ? 1 : -1);

  await txDone(unwrap(tx));
}
