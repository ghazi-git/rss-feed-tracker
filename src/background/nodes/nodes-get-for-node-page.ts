import { FeedMetadata, getDBConnection, TreeNode } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { getChildFeedIds } from "@/background/utils/nodes";
import { NodeResponse } from "@/messaging-wrapper";

/**
 * @raises NotFoundError
 */
export async function getNode(id: number): Promise<NodeResponse> {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes", "feedmetadata"]);
  const nodeStore = tx.objectStore("nodes");
  const metadataStore = tx.objectStore("feedmetadata");

  const node = await nodeStore.get(id);
  if (!node) {
    const msg = "Unable to find the feed/folder, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  const now = Date.now();
  if (node.type === "feed") {
    const metadata = await metadataStore.get(id);
    // lastRunAt will be the starting time for marking all posts as read
    const lastRunAt = metadata?.lastRunAt ?? now;
    return { ...node, markAsReadUntil: lastRunAt, children: [] };
  }

  const allNodes = await nodeStore.getAll();
  const metadata = await metadataStore.getAll();
  const folderLastRunAt = getNodeLastRunAt(node, allNodes, metadata, now);

  const children = allNodes
    .filter((n) => n.parentId === id)
    .map((n) => {
      const lastRunAt = getNodeLastRunAt(n, allNodes, metadata, now);
      return { ...n, markAsReadUntil: lastRunAt };
    })
    .toSorted((n1, n2) => n1.sortOrder - n2.sortOrder);

  return { ...node, markAsReadUntil: folderLastRunAt, children };
}

function getNodeLastRunAt(
  node: TreeNode,
  allNodes: TreeNode[],
  metadata: FeedMetadata[],
  defaultTime: number,
) {
  if (node.type === "feed") {
    const feedMetadata = metadata.find((m) => m.feedId === node.id);
    return feedMetadata?.lastRunAt ?? defaultTime;
  } else {
    // the folder's lastRunAt is the max lastRunAt of feeds inside it
    const childFeedIds = getChildFeedIds(node, allNodes);
    const lastRunAts = metadata
      .filter((m) => childFeedIds.has(m.feedId))
      .map((m) => m.lastRunAt)
      .filter((runAt) => runAt !== null)
      .toSorted();
    return lastRunAts.at(-1) ?? defaultTime;
  }
}
