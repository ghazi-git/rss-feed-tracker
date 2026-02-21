import { setUnreadCountOnExtensionBadge } from "@/background/utils/badge-unread-count";
import { NotFoundError } from "@/background/utils/errors";
import { getAncestors, getNodeMap } from "@/background/utils/nodes";
import { getDBConnection, Post } from "@/db-setup";
import { txDone } from "@/utils/idb-helpers";
import { getChildFeedIds } from "@/utils/nodes";

export async function markAllPostsAsRead(
  nodeId: number,
  markAsReadUntil: number,
) {
  using conn = await getDBConnection();

  const tx = conn.db.transaction(["posts", "nodes"], "readwrite");
  const nodeStore = tx.objectStore("nodes");
  const node = await nodeStore.get(nodeId);
  if (!node) {
    throw new NotFoundError(
      "Unable to find the feed/folder, it may have been already deleted.",
      { cause: `mark-all-as-read: failure to find the node id=${nodeId}` },
    );
  }

  const allNodes = await nodeStore.getAll();
  let posts: Post[] = [];
  const postStore = tx.objectStore("posts");
  if (node.type === "feed") {
    const index = postStore.index("by_unread_feed_id_received_at_guid");
    posts = await index.getAll(
      IDBKeyRange.bound([1, nodeId, 0], [1, nodeId, markAsReadUntil + 1]),
    );
  } else if (!node.parentId) {
    // root folder: mark all unread as read
    const index = postStore.index("by_unread_received_at_feed_id_guid");
    posts = await index.getAll(
      IDBKeyRange.bound([1, 0], [1, markAsReadUntil + 1], false, true),
    );
  } else {
    // non-root folder: determine feeds under this folder and identify the posts
    const index = postStore.index("by_unread_received_at_feed_id_guid");
    const feedIds = getChildFeedIds(node, allNodes);
    const query = IDBKeyRange.bound([1, 0], [1, markAsReadUntil + 1]);
    let cursor = await index.openCursor(query);
    while (cursor) {
      const post = cursor.value;
      if (feedIds.has(post.feedId)) {
        posts.push(post);
      }
      cursor = await cursor.continue();
    }
  }

  // track the number of posts marked unread for each feed. Later, we'll update
  // the unreadCount of each feed and all ancestor folders
  const unreadByFeed = new Map<number, number>();
  const promises = [];
  for (const post of posts) {
    post.unread = 0;
    promises.push(postStore.put(post));
    const currentCount = unreadByFeed.get(post.feedId) ?? 0;
    unreadByFeed.set(post.feedId, currentCount + 1);
  }
  await Promise.all(promises);

  // update the unread counts of corresponding feeds and their ancestors
  const nodeMap = getNodeMap(allNodes);
  for (const [feedId, unreadCount] of unreadByFeed.entries()) {
    const ancestors = getAncestors(feedId, nodeMap);
    const proms = ancestors.map((a) => {
      a.unreadCount = Math.max(a.unreadCount - unreadCount, 0);
      return nodeStore.put(a);
    });
    await Promise.all(proms);
  }

  // update the unread count on the extension badge
  const rootFolder = allNodes.find((n) => !n.parentId);
  if (rootFolder) {
    setUnreadCountOnExtensionBadge(rootFolder.unreadCount);
  }

  await txDone(tx);
}
