import {
  FeedMetadata,
  Folder,
  getDBConnection,
  TreeNode,
} from "@/background/db-setup";
import { getNodeTree } from "@/background/folders/folders-options";
import { NotFoundError } from "@/background/utils/errors";
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
  if (node.type === "feed") {
    const metadata = await metadataStore.get(id);
    // lastRunAt will be the starting time for marking all posts as read
    const lastRunAt = metadata?.lastRunAt ?? Date.now();
    return { ...node, lastRunAt, children: [] };
  }

  const allNodes = await nodeStore.getAll();
  const childFeedIds = getChildFeedIds(node, allNodes);
  let lastRunAt: number | null = null;
  if (childFeedIds.size) {
    const metadata = await metadataStore.getAll();
    lastRunAt = getFolderLastRunAt(metadata, childFeedIds);
  }
  const children = allNodes
    .filter((n) => n.parentId === id)
    .toSorted((n1, n2) => n1.sortOrder - n2.sortOrder);
  return { ...node, lastRunAt: lastRunAt ?? Date.now(), children };
}

function getChildFeedIds(folder: Folder, nodes: TreeNode[]) {
  const nodeTree = getNodeTree(folder, nodes);
  const childFeeds = nodeTree.map(([n]) => n).filter((n) => n.type === "feed");
  return new Set(childFeeds.map((f) => f.id));
}

function getFolderLastRunAt(metadata: FeedMetadata[], feedIds: Set<number>) {
  // the folder's lastRunAt is the max lastRunAt of feeds inside it
  const lastRunAts = metadata
    .filter((m) => feedIds.has(m.feedId))
    .map((m) => m.lastRunAt)
    .filter((runAt) => runAt !== null);
  return lastRunAts.length ? Math.max(...lastRunAts) : null;
}
