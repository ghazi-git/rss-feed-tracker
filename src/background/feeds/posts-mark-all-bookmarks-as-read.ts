import { unwrap } from "idb";

import { setUnreadCountOnExtensionBadge } from "@/background/utils/badge-unread-count";
import { txDone } from "@/background/utils/idb-helpers";
import { getAncestors, getNodeMap } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";

export async function markAllBookmarksAsRead() {
  using conn = await getDBConnection();

  const tx = conn.db.transaction(["posts", "nodes"], "readwrite");
  const postStore = tx.objectStore("posts");
  const bookmarksIndex = postStore.index(
    "by_bookmarked_unread_published_at_feed_id_guid",
  );

  // track the number of posts marked unread for each feed. Later, we'll update
  // the unreadCount of each feed and all ancestor folders
  const unreadByFeed = new Map<number, number>();
  const promises = [];
  const query = IDBKeyRange.lowerBound([1, 1]);
  const posts = await bookmarksIndex.getAll(query);
  for (const post of posts) {
    post.unread = 0;
    promises.push(postStore.put(post));
    const currentCount = unreadByFeed.get(post.feedId) ?? 0;
    unreadByFeed.set(post.feedId, currentCount + 1);
  }
  await Promise.all(promises);

  // update the unread counts of corresponding feeds and their ancestors
  const nodeStore = tx.objectStore("nodes");
  const nodes = await nodeStore.getAll();
  const nodeMap = getNodeMap(nodes);
  for (const [feedId, unreadCount] of unreadByFeed.entries()) {
    const ancestors = getAncestors(feedId, nodeMap);
    const proms = ancestors.map((a) => {
      a.unreadCount = Math.max(a.unreadCount - unreadCount, 0);
      return nodeStore.put(a);
    });
    await Promise.all(proms);
  }

  // update the unread count on the extension badge
  const rootFolder = nodes.find((n) => !n.parentId);
  if (rootFolder) {
    setUnreadCountOnExtensionBadge(rootFolder.unreadCount);
  }

  await txDone(unwrap(tx));
}
