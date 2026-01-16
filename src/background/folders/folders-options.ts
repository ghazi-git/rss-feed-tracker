import {
  createRootFolder,
  ExtensionDB,
  Folder,
  getDBConnection,
  TreeNode,
} from "@/db-setup";
import { FolderOption } from "@/messaging-wrapper";

export async function getFolderOptions(): Promise<FolderOption[]> {
  using conn = await getDBConnection();
  return getFolderOptionsAsTree(conn.db);
}

export async function getFolderOptionsAsTree(
  db: ExtensionDB,
): Promise<FolderOption[]> {
  const nodes = await db.getAllFromIndex("nodes", "by_type", "folder");
  const folders = nodes.filter((n) => n.type === "folder");
  const rootFolder = folders.find((f) => f.parentId === null);
  if (!rootFolder) {
    const root = await createRootFolder(db);
    return [{ value: root.id, label: root.name }];
  }

  const orderedFolders = getNodeTree(rootFolder, folders);
  return orderedFolders.map(([n, level]) => ({
    value: n.id,
    // \xa0 is a non-breaking space used to illustrate the tree hierarchy
    label: `${"\xa0".repeat(level * 4)}${n.name}`,
  }));
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

type NodeItem = [TreeNode, number];
