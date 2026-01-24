import { ExtensionDB, Feed, FeedMetadata, ReadWriteTX } from "@/db-setup";
import { getObject, saveObject, txDone } from "@/utils/idb-helpers";

export async function saveSuccessMetadata(
  tx: ReadWriteTX,
  feedId: number,
  feedFrequency: number | null,
  fetchTime: number,
  hasNewPosts: boolean = false,
  notes: string | null = null,
) {
  const store = tx.objectStore("feedmetadata");
  let metadata = await store.get(feedId);
  if (!metadata) {
    metadata = getInitialFeedmetadata(feedId);
  }

  const updates: Partial<FeedMetadata> = {
    nextRunAt: feedFrequency ? fetchTime + feedFrequency : null,
    lastRunAt: fetchTime,
    lastRunResult: "success",
    lastRunNotes: notes,
    lastSuccessfulRunAt: fetchTime,
  };
  if (hasNewPosts) {
    updates.lastUpdatedAt = fetchTime;
  }
  await store.put({ ...metadata, ...updates });
}

export function getInitialFeedmetadata(feedId: number): FeedMetadata {
  return {
    feedId,
    nextRunAt: null,
    lastRunAt: null,
    lastRunResult: null,
    lastRunNotes: null,
    lastSuccessfulRunAt: null,
    lastUpdatedAt: null,
  };
}

export async function saveFailureMetadata(
  db: ExtensionDB,
  feed: Feed,
  failureReason: string,
) {
  const tx = db.transaction(["feedmetadata"], "readwrite");
  let metadata = await getObject(tx, "feedmetadata", feed.id);
  if (!metadata) {
    metadata = getInitialFeedmetadata(feed.id);
  }
  const now = Date.now();
  const updates: Partial<FeedMetadata> = {
    nextRunAt: feed.feed.updateFrequency
      ? now + feed.feed.updateFrequency
      : null,
    lastRunAt: now,
    lastRunResult: "failure",
    lastRunNotes: failureReason,
  };
  await saveObject(tx, "feedmetadata", { ...metadata, ...updates });

  await txDone(tx);
}
