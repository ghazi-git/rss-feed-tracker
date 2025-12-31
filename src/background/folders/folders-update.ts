import { unwrap } from "idb";

import { getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { txDone } from "@/background/utils/idb-helpers";
import { getAncestors, getNodeMap } from "@/background/utils/nodes";

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
  await nodeStore.put(updated);

  const newParentId = updated.parentId;
  if (newParentId && newParentId !== old.parentId) {
    // update the sort order when moving the folder
    const index = nodeStore.index("by_parent_id_sort_order");
    const children = await index.getAll({
      query: IDBKeyRange.bound([newParentId, 0], [newParentId, Infinity]),
      count: 1,
      direction: "prev",
    });
    updated.sortOrder = (children[0]?.sortOrder ?? 0) + 10_000;
    await nodeStore.put(updated);

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
