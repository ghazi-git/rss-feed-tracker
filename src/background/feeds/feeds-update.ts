import { unwrap } from "idb";

import { FeedMetadata, getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { txDone } from "@/background/utils/idb-helpers";
import { getAncestors, getNodeMap } from "@/background/utils/nodes";
import { FeedFormData } from "@/messaging-wrapper";

/**
 * - Save the updated feed data provided by the user
 * - Update the sortOrder and unread counts of old and new parent folders
 * if the parent folder changes
 * - Update feed metadata if the update frequency changes
 */
export async function updateFeed(id: number, feedData: FeedFormData) {
  using conn = await getDBConnection();

  const tx = conn.db.transaction(["nodes", "feedmetadata"], "readwrite");
  const nodeStore = tx.objectStore("nodes");
  const old = await nodeStore.get(id);
  if (!old || old.type !== "feed") {
    throw new NotFoundError(
      "Unable to find the feed to be updated, it may have been deleted.",
      { cause: `feed-update: failure to get the feed id=${id}` },
    );
  }

  const updated = structuredClone(old);
  updated.name = feedData.name;
  updated.parentId = feedData.folder;
  updated.feed.url = feedData.url;
  updated.feed.updateFrequency = feedData.frequency;
  await nodeStore.put(updated);

  const newParentId = updated.parentId;
  if (newParentId && newParentId !== old.parentId) {
    // update the sort order when moving the feed to a new folder
    const index = nodeStore.index("by_parent_id_sort_order");
    const children = await index.getAll({
      query: IDBKeyRange.bound([newParentId, 0], [newParentId, Infinity]),
      count: 1,
      direction: "prev",
    });
    updated.sortOrder = (children[0]?.sortOrder ?? 0) + 10_000;
    await nodeStore.put(updated);

    // update the unread counts
    if (updated.unreadCount) {
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

  if (updated.feed.updateFrequency !== old.feed.updateFrequency) {
    const metadataStore = tx.objectStore("feedmetadata");
    let metadata = await metadataStore.get(id);
    if (!metadata) {
      metadata = {
        feedId: id,
        nextRunAt: null,
        lastRunAt: null,
        lastRunResult: null,
        lastRunNotes: null,
        lastSuccessfulRunAt: null,
        lastUpdatedAt: null,
      } as FeedMetadata;
    }
    const nextRunAt = metadata.lastRunAt
      ? metadata.lastRunAt + updated.feed.updateFrequency
      : Date.now();
    metadata.nextRunAt = nextRunAt;
    await metadataStore.put(metadata);
  }
  await txDone(unwrap(tx));
}
