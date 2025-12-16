import { ExtensionDB, getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { NodeResponse } from "@/messaging-wrapper";

/**
 * @raises NotFoundError
 */
export async function getNode(id: number): Promise<NodeResponse> {
  using conn = await getDBConnection();
  const node = await getNodeFromDB(conn.db, id);
  if (node.type === "feed") return { ...node, children: [] };

  const children = await getFolderChildren(conn.db, id);
  return { ...node, children };
}

async function getNodeFromDB(db: ExtensionDB, id: number) {
  const node = await db.get("nodes", id);
  if (!node) {
    const msg = "Unable to find the feed/folder, it may have been deleted.";
    throw new NotFoundError(msg);
  }
  return node;
}

async function getFolderChildren(db: ExtensionDB, parentId: number) {
  return await db.getAllFromIndex(
    "nodes",
    "by_parent_id_sort_order",
    IDBKeyRange.bound([parentId], [parentId + 1], false, true),
  );
}
