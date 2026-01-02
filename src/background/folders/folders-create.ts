import { unwrap } from "idb";

import { Folder, getDBConnection } from "@/background/db-setup";
import { txDone } from "@/background/utils/idb-helpers";
import { getHighestSortOrder } from "@/background/utils/nodes";
import { FolderFormData } from "@/messaging-wrapper";

export async function createFolder(data: FolderFormData) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"], "readwrite");

  const sortOrder = await getHighestSortOrder(tx, data.parentFolder);
  const folder = {
    type: "folder",
    name: data.name,
    parentId: data.parentFolder,
    sortOrder,
    createdAt: Date.now(),
    unreadCount: 0,
    feed: null,
  } as Folder;

  const nodeStore = tx.objectStore("nodes");
  const folderId = await nodeStore.add(folder);

  await txDone(unwrap(tx));

  return folderId;
}
