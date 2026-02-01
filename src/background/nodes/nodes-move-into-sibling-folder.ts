import { NotFoundError } from "@/background/utils/errors";
import { getHighestSortOrder } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { txDone } from "@/utils/idb-helpers";

export async function moveIntoSiblingFolder(nodeId: number, folderId: number) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"], "readwrite");
  const store = tx.objectStore("nodes");
  const [node, folder] = await Promise.all([
    store.get(nodeId),
    store.get(folderId),
  ]);
  if (
    !node ||
    !folder ||
    folder.type !== "folder" ||
    node.parentId !== folder.parentId
  ) {
    const msg = "Unable to find the feed/folder, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  const sortOrder = await getHighestSortOrder(tx, folder.id);
  node.sortOrder = sortOrder;
  node.parentId = folder.id;
  folder.unreadCount += node.unreadCount;
  await Promise.all([store.put(node), store.put(folder)]);

  await txDone(tx);
}
