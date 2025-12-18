import {
  createRootFolder,
  Folder,
  getDBConnection,
} from "@/background/db-setup";
import { FolderOption } from "@/messaging-wrapper";

export async function getFolderOptions(): Promise<FolderOption[]> {
  using conn = await getDBConnection();

  const nodes = await conn.db.getAllFromIndex("nodes", "by_type", "folder");
  const folders = nodes.filter((n) => n.type === "folder");
  const rootFolder = folders.find((f) => f.parentId === null);
  if (!rootFolder) {
    const root = await createRootFolder(conn.db);
    return [{ value: root.id, label: root.name }];
  }

  const orderedFolders = getFoldersTree(rootFolder, folders);
  return orderedFolders.map(([n, level]) => ({
    value: n.id,
    // \xa0 is a non-breaking space used to illustrate the tree hierarchy
    label: `${"\xa0".repeat(level * 4)}${n.name}`,
  }));
}

/**
 * return an array of folders ordered according to a DFS traversal and their
 * sortOrder within their parent
 */
function getFoldersTree(rootFolder: Folder, folders: Folder[]) {
  const result: StackItem[] = [];
  const stack: StackItem[] = [[rootFolder, 0]];

  while (stack.length > 0) {
    const [folder, level] = stack.shift()!;
    result.push([folder, level]);

    const children = folders.filter((f) => f.parentId === folder.id);
    children.sort((f1, f2) => f1.sortOrder - f2.sortOrder);
    stack.unshift(...children.map((f) => [f, level + 1] as StackItem));
  }
  return result;
}

type StackItem = [Folder, number];
