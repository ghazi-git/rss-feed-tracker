import { NotFoundError } from "@/background/utils/errors";
import { getNodeLastRunAt } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { NodePostsResponse } from "@/messaging-wrapper";
import { getChildFeedIds } from "@/utils/nodes";

export async function getNodeForNodePostsPage(
  id: number,
): Promise<NodePostsResponse> {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes", "posts"]);
  const nodeStore = tx.objectStore("nodes");
  const postStore = tx.objectStore("posts");

  const node = await nodeStore.get(id);
  if (!node) {
    const msg = "Unable to find the feed/folder, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  const now = Date.now();
  if (node.type === "feed") {
    const lastRunAt = node.feed.lastRunAt ?? now;
    const post = await postStore.get(
      IDBKeyRange.bound([id], [id + 1], false, true),
    );
    return { ...node, markAsReadUntil: lastRunAt, hasPosts: !!post };
  }

  const allNodes = await nodeStore.getAll();
  const folderLastRunAt = getNodeLastRunAt(node, allNodes, now);

  let hasPosts = false;
  if (!node.parentId) {
    // root folder
    const posts = await postStore.getAll({ count: 1 });
    hasPosts = posts.length > 0;
  } else {
    const childFeedIds = getChildFeedIds(node, allNodes);
    for (const feedId of childFeedIds) {
      const query = IDBKeyRange.bound([feedId], [feedId + 1], false, true);
      const post = await postStore.get(query);
      if (post) {
        hasPosts = true;
        break;
      }
    }
  }
  return { ...node, markAsReadUntil: folderLastRunAt, hasPosts };
}
