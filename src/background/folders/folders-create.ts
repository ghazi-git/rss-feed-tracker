import { Folder, getDBConnection } from "@/background/db-setup";
import { getHighestSortOrder } from "@/background/utils/nodes";
import { FolderFormData } from "@/messaging-wrapper";

export async function createFolder(data: FolderFormData) {
  using conn = await getDBConnection();

  const sortOrder = await getHighestSortOrder(conn.db, data.parentFolder);
  const folder = {
    type: "folder",
    name: data.name,
    parentId: data.parentFolder,
    sortOrder,
    createdAt: Date.now(),
    unreadCount: 0,
    feed: null,
  };

  const folderId = await conn.db.add("nodes", folder as Folder);
  return folderId;
}
