import { unwrap } from "idb";

import { getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { txDone } from "@/background/utils/idb-helpers";
import {
  getAncestors,
  getHighestSortOrder,
  getNodeMap,
} from "@/background/utils/nodes";

export async function updateFolder(
  id: number,
  name: string,
  parent: number | null,
) {
  using conn = await getDBConnection();

  const tx = conn.db.transaction(["nodes", "feedmetadata"], "readwrite");
  const nodeStore = tx.objectStore("nodes");
  const old = await nodeStore.get(id);
  if (!old || old.type !== "folder") {
    throw new NotFoundError(
      "Unable to find the folder to be updated, it may have been deleted.",
      { cause: `folder-update: failure to get the folder id=${id}` },
    );
  }

  const updated = structuredClone(old);
  updated.name = name;
  updated.parentId = parent;
  const newParentId = updated.parentId;
  if (newParentId && newParentId !== old.parentId) {
    // update the sort order when moving the folder
    updated.sortOrder = await getHighestSortOrder(tx, newParentId);
    await nodeStore.put(updated);
  }

  await nodeStore.put(updated);

  if (newParentId && newParentId !== old.parentId) {
    // update the unread counts
    if (old.parentId && updated.unreadCount) {
      const nodes = await nodeStore.getAll();
      const nodeMap = getNodeMap(nodes);
      // update the unread count of the previous ancestors
      const oldAncestors = getAncestors(old.parentId, nodeMap);
      const oldPromises = oldAncestors.map((a) => {
        a.unreadCount = Math.max(a.unreadCount - updated.unreadCount, 0);
        return nodeStore.put(a);
      });
      await Promise.all(oldPromises);
      // update the unread count of the new ancestors
      const newAncestors = getAncestors(newParentId, nodeMap);
      const newPromises = newAncestors.map((a) => {
        a.unreadCount = a.unreadCount + updated.unreadCount;
        return nodeStore.put(a);
      });
      await Promise.all(newPromises);
    }
  }

  await txDone(unwrap(tx));
}
