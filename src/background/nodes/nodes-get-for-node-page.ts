import { NotFoundError } from "@/background/utils/errors";
import { getNodeLastRunAt } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { NodeResponse } from "@/messaging-wrapper";

export async function getNodeForNodePage(id: number): Promise<NodeResponse> {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"]);
  const nodeStore = tx.objectStore("nodes");

  const node = await nodeStore.get(id);
  if (!node) {
    const msg = "Unable to find the feed/folder, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  const now = Date.now();
  if (node.type === "feed") {
    // lastRunAt will be the starting time for marking all posts as read
    const lastRunAt = node.feed.lastRunAt ?? now;
    return { ...node, markAsReadUntil: lastRunAt, children: [] };
  }

  const allNodes = await nodeStore.getAll();
  const folderLastRunAt = getNodeLastRunAt(node, allNodes, now);

  const children = allNodes
    .filter((n) => n.parentId === id)
    .map((n) => {
      const lastRunAt = getNodeLastRunAt(n, allNodes, now);
      return { ...n, markAsReadUntil: lastRunAt };
    })
    .toSorted((n1, n2) => n1.sortOrder - n2.sortOrder);

  return { ...node, markAsReadUntil: folderLastRunAt, children };
}
