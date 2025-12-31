import { unwrap } from "idb";

import { getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { txDone } from "@/background/utils/idb-helpers";
import { getAncestors, getNodeMap } from "@/background/utils/nodes";

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
  const nodeStore = tx.objectStore("nodes");
  const nodes = await nodeStore.getAll();
  const nodeMap = getNodeMap(nodes);
  const ancestors = getAncestors(feedId, nodeMap);
  const countChange = unread ? 1 : -1;
  const promises = ancestors.map((a) =>
    nodeStore.put({
      ...a,
      unreadCount: Math.max(a.unreadCount + countChange, 0),
    }),
  );
  await Promise.all([...promises, txDone(unwrap(tx))]);
}
