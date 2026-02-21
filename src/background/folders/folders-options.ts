import { createRootFolder } from "@/background/utils/nodes";
import { ExtensionDB, getDBConnection } from "@/db-setup";
import { FolderOption } from "@/messaging-wrapper";
import { getNodeTree, getOptions } from "@/utils/nodes";

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
  return getOptions(orderedFolders);
}
