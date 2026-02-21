import { Folder, TreeNode } from "@/db-setup";

export function getChildFeedIds(folder: Folder, nodes: TreeNode[]) {
  const nodeTree = getNodeTree(folder, nodes);
  const childFeeds = nodeTree.map(([n]) => n).filter((n) => n.type === "feed");
  return new Set(childFeeds.map((f) => f.id));
}

/**
 * return an array of nodes ordered according to a DFS traversal and their
 * sortOrder within their parent
 */
export function getNodeTree(rootFolder: Folder, nodes: TreeNode[]) {
  const result: NodeItem[] = [];
  const stack: NodeItem[] = [[rootFolder, 0]];

  while (stack.length > 0) {
    const [folder, level] = stack.shift()!;
    result.push([folder, level]);

    const children = nodes.filter((f) => f.parentId === folder.id);
    children.sort((f1, f2) => f1.sortOrder - f2.sortOrder);
    stack.unshift(...children.map((f) => [f, level + 1] as NodeItem));
  }
  return result;
}

export function getOptions(nodes: NodeItem[]) {
  return nodes.map(([n, level]) => ({
    value: n.id,
    // \xa0 is a non-breaking space used to illustrate the tree hierarchy
    label: `${"\xa0".repeat(level * 4)}${n.name}`,
  }));
}

type NodeItem = [TreeNode, number];
