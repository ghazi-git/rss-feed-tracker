import { getDBConnection } from "@/background/db-setup";
import { FeedUpdateError } from "@/background/utils/errors";
import { update } from "@/background/utils/idb-helpers";
import { getHighestSortOrder } from "@/background/utils/nodes";
import { FeedFormData } from "@/messaging-wrapper";

export async function updateFeed(id: number, feedData: FeedFormData) {
  using conn = await getDBConnection();

  const old = await conn.db.get("nodes", id);
  if (!old || old.type !== "feed") {
    throw new FeedUpdateError(
      "Unable to find the feed to be updated, it may have been deleted.",
      { cause: `feed-update: failure to get the feed id=${id}` },
    );
  }

  const updated = structuredClone(old);
  updated.name = feedData.name;
  updated.parentId = feedData.folder;
  updated.feed.url = feedData.url;
  updated.feed.updateFrequency = feedData.frequency;
  if (updated.parentId && updated.parentId !== old.parentId) {
    const sortOrder = await getHighestSortOrder(conn.db, updated.parentId);
    updated.sortOrder = sortOrder;
  }
  await conn.db.put("nodes", updated);

  if (updated.feed.updateFrequency !== old.feed.updateFrequency) {
    await update(conn.db, "feedmetadata", id, (prev) => {
      let nextRunAt: number;
      if (prev.lastRunAt) {
        nextRunAt = prev.lastRunAt + updated.feed.updateFrequency;
      } else {
        nextRunAt = Date.now();
      }
      return { ...prev, nextRunAt };
    });
  }
}
