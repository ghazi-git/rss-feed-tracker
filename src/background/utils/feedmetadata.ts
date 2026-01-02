import { FeedMetadata, ReadWriteTX } from "@/background/db-setup";

export async function saveSuccessMetadata(
  tx: ReadWriteTX,
  feedId: number,
  feedFrequency: number,
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
    nextRunAt: fetchTime + feedFrequency,
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
