import { NotFoundError } from "@/background/utils/errors";
import { getDBConnection, ReadTX, ReadWriteTX } from "@/db-setup";
import { RelativePlacement } from "@/messaging-wrapper";
import { getAllFromIndex, txDone } from "@/utils/idb-helpers";
import { SORT_ORDER_STEP } from "@/utils/settings";

/**
 * move the node relative to a target by determining the prev/next sibling
 * according to the placement and then
 * newSortOrder = (target.sortOrder + sibling.sortOrder) / 2
 *
 * To avoid floating-point issues due to the division, we rebalance the
 * sortOrders once a certain threshold between siblings is reached
 */
export async function moveRelativeToTarget(
  nodeId: number,
  targetId: number,
  placement: RelativePlacement,
) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"], "readwrite");
  const store = tx.objectStore("nodes");
  const [node, target] = await Promise.all([
    store.get(nodeId),
    store.get(targetId),
  ]);
  if (
    !node ||
    !target ||
    !target.parentId ||
    node.parentId !== target.parentId
  ) {
    const msg = "Unable to find the feed/folder, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  const siblingSortOrder = await getSiblingSortOrder(
    tx,
    target.parentId,
    target.sortOrder,
    placement,
  );
  // place the node between the target and the next/prev sibling
  node.sortOrder = (siblingSortOrder + target.sortOrder) / 2;
  await store.put(node);

  if (Math.abs(siblingSortOrder - target.sortOrder) < 1) {
    // rebalance the sortOrder for all folder children to avoid floating-point
    // issues in the future
    const children = await getAllFromIndex(
      tx,
      "nodes",
      "by_parent_id_sort_order",
      { query: IDBKeyRange.bound([target.parentId], [target.parentId + 1]) },
    );
    children.forEach((child, idx) => {
      child.sortOrder = (idx + 1) * SORT_ORDER_STEP;
    });
    await Promise.all(children.map((c) => store.put(c)));
  }

  await txDone(tx);
}

async function getSiblingSortOrder(
  tx: ReadTX | ReadWriteTX,
  targetParentId: number,
  targetSortOrder: number,
  placement: RelativePlacement,
) {
  if (placement === "reorder-before") {
    const query = IDBKeyRange.bound(
      [targetParentId],
      [targetParentId, targetSortOrder],
      false,
      true,
    );
    const siblings = await getAllFromIndex(
      tx,
      "nodes",
      "by_parent_id_sort_order",
      { query, count: 1, direction: "prev" },
    );
    return siblings[0] ? siblings[0].sortOrder : 0;
  } else {
    const query = IDBKeyRange.bound(
      [targetParentId, targetSortOrder],
      [targetParentId + 1],
      true,
      true,
    );
    const siblings = await getAllFromIndex(
      tx,
      "nodes",
      "by_parent_id_sort_order",
      { query, count: 1 },
    );
    return siblings[0]
      ? siblings[0].sortOrder
      : // this is done so that the sortOrder of a node moved to the end is
        // currentLastNode.sortOrder + SORT_ORDER_STEP.
        2 * SORT_ORDER_STEP + targetSortOrder;
  }
}
