import {
  FeedMetadata,
  Folder,
  ReadTX,
  ReadWriteTX,
  TreeNode,
} from "@/background/db-setup";
import { getNodeTree } from "@/background/folders/folders-options";
import { setUnreadCountOnExtensionBadge } from "@/background/utils/badge-unread-count";

export async function getHighestSortOrder(
  tx: ReadTX | ReadWriteTX,
  folder: number,
) {
  const nodeStore = tx.objectStore("nodes");
  const index = nodeStore.index("by_parent_id_sort_order");
  const children = await index.getAll({
    query: IDBKeyRange.bound([folder], [folder + 1], false, true),
    count: 1,
    direction: "prev",
  });
  const sortOrder = children[0]?.sortOrder ?? 0;
  return sortOrder + 10_000;
}

export function getNodeMap(nodes: TreeNode[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

export function getAncestors(nodeId: number, nodeMap: Map<number, TreeNode>) {
  const ancestors: TreeNode[] = [];
  let id: number | null = nodeId;
  while (id) {
    const node = nodeMap.get(id);
    if (!node) break;

    ancestors.push(node);
    id = node.parentId;
  }

  return ancestors;
}

export function getChildFeedIds(folder: Folder, nodes: TreeNode[]) {
  const nodeTree = getNodeTree(folder, nodes);
  const childFeeds = nodeTree.map(([n]) => n).filter((n) => n.type === "feed");
  return new Set(childFeeds.map((f) => f.id));
}

export function getNodeLastRunAt(
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
export async function updateFeedUnreadCount(
  tx: ReadWriteTX,
  nodeId: number,
  delta: number,
) {
  const nodeStore = tx.objectStore("nodes");
  const nodes = await nodeStore.getAll();
  const nodeMap = getNodeMap(nodes);
  const ancestors = getAncestors(nodeId, nodeMap);
  const promises = ancestors.map((a) => {
    a.unreadCount = Math.max(a.unreadCount + delta, 0);
    nodeStore.put(a);
  });
  await Promise.all(promises);
  // update the unread count on the extension badge
  const rootFolder = ancestors.find((n) => !n.parentId);
  if (rootFolder) {
    setUnreadCountOnExtensionBadge(rootFolder.unreadCount);
  }
}
