import { Feed, getDBConnection } from "@/background/db-setup";
import { assertTypeIs } from "@/background/utils/assert-type";
import { FeedUpdateError } from "@/background/utils/errors";
import { update } from "@/background/utils/idb-helpers";
import { getHighestSortOrder } from "@/background/utils/nodes";
import { FeedFormData } from "@/messaging-wrapper";

export async function updateFeed(id: number, feedData: FeedFormData) {
  using conn = await getDBConnection();

  const old = await conn.db.get("nodes", id);
  if (!old) {
    console.error(`feed-update: failure to get the feed id=${id}`);
    throw new FeedUpdateError("Unable to update the feed. Please try again.");
  }

  assertTypeIs<Feed>(old);

  const updated = structuredClone(old);
  updated.name = feedData.name;
  updated.parentId = feedData.folder;
  updated.feed.url = feedData.url;
  updated.feed.updateFrequency = feedData.frequency;

  try {
    await conn.db.put("nodes", updated);
  } catch (e) {
    console.error("feed-update: failure to update the feed", e);
    throw new FeedUpdateError("Unable to update the feed. Please try again.");
  }

  if (updated.parentId !== old.parentId) {
    try {
      const sortOrder = await getHighestSortOrder(conn.db, updated.parentId);
      await update(conn.db, "nodes", id, { sortOrder });
    } catch (e) {
      console.error("feed-update: failure to update the feed sort order", e);
    }
  }

  if (updated.feed.updateFrequency !== old.feed.updateFrequency) {
    try {
      await update(conn.db, "feedmetadata", id, (prev) => {
        let nextRunAt: number;
        if (prev.lastRunAt) {
          nextRunAt = prev.lastRunAt + updated.feed.updateFrequency;
        } else {
          nextRunAt = Date.now();
        }
        return { ...prev, nextRunAt };
      });
    } catch (e) {
      console.error("feed-update: failure to update the feedmetadata", e);
    }
  }
}
