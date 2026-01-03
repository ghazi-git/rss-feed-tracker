import { Folder, ReadTX, ReadWriteTX, TreeNode } from "@/background/db-setup";
import { getNodeTree } from "@/background/folders/folders-options";

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
