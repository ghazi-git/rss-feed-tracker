import { getFolderOptionsAsTree } from "@/background/folders/folders-options";
import { NotFoundError } from "@/background/utils/errors";
import { getDBConnection } from "@/db-setup";

export async function getFolder(id: number) {
  using conn = await getDBConnection();

  const [node, folderOptions] = await Promise.all([
    conn.db.get("nodes", id),
    getFolderOptionsAsTree(conn.db),
  ]);
  if (!node || node.type !== "folder") {
    const msg = "Unable to find the folder, it may have been deleted.";
    throw new NotFoundError(msg, { cause: `folder not found id=${id}` });
  }

  return {
    name: node.name,
    parentFolder: node.parentId,
    folderOptions,
  };
}
