import { unwrap } from "idb";

import { getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { getInitialFeedmetadata } from "@/background/utils/feedmetadata";
import { txDone } from "@/background/utils/idb-helpers";
import {
  getAncestors,
  getHighestSortOrder,
  getNodeMap,
} from "@/background/utils/nodes";
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
  const newParentId = updated.parentId;
  if (newParentId && newParentId !== old.parentId) {
    // update the sort order when moving the feed to a new folder
    updated.sortOrder = await getHighestSortOrder(tx, newParentId);
  }
  updated.feed.url = feedData.url;
  updated.feed.updateFrequency = feedData.frequency;
  await nodeStore.put(updated);

  if (newParentId && newParentId !== old.parentId) {
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
      metadata = getInitialFeedmetadata(id);
    }
    const nextRunAt = metadata.lastRunAt
      ? metadata.lastRunAt + updated.feed.updateFrequency
      : Date.now();
    metadata.nextRunAt = nextRunAt;
    await metadataStore.put(metadata);
  }
  await txDone(unwrap(tx));
}
