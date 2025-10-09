import { ExtensionDB, FeedMetadata, Post } from "@/background/db-setup";
import { RequestResult, update } from "@/background/utils/idb-helpers";

export async function createFeedMetadata(
  db: ExtensionDB,
  feedId: number,
): Promise<FeedMetadata> {
  const metadata = {
    feedId,
    nextRunAt: null,
    lastRunAt: null,
    lastRunResult: null,
    lastRunNotes: null,
    lastSuccessfulRunAt: null,
    lastUpdatedAt: null,
  };
  await db.add("feedmetadata", metadata);
  return metadata;
}

export async function saveSuccessMetadata(
  db: ExtensionDB,
  feedId: number,
  feedFrequency: number,
  fetchTime: number,
  hasNewPosts: boolean = false,
  notes: string | null = null,
) {
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
  try {
    await update(db, "feedmetadata", feedId, updates);
  } catch (e) {
    // if the metadata update fails, no need to notify the user about it
    console.error("feedmetadata-success: failure to save to db", e);
  }
}

export async function saveFailureMetadata(
  db: ExtensionDB,
  feedId: number,
  feedFrequency: number,
  failureReason: string,
  fetchTime: number,
) {
  const updates: Partial<FeedMetadata> = {
    nextRunAt: fetchTime + feedFrequency,
    lastRunAt: fetchTime,
    lastRunResult: "failure",
    lastRunNotes: failureReason,
  };
  try {
    await update(db, "feedmetadata", feedId, updates);
  } catch (e) {
    // if the metadata update fails, no need to notify the user about it
    console.error("feedmetadata-failure: failure to save to db", e);
  }
}

export function describeSaveResults(results: RequestResult<Post>[]) {
  const failed = results.filter((res) => !res.success);
  if (!failed.length) return null;

  const duplicateCount = failed.filter(
    (res) => res.errorName === "ConstraintError",
  ).length;
  const unexpectedErrorsCount = failed.length - duplicateCount;
  const notes: string[] = [`TotalPosts[${results.length}]`];
  if (duplicateCount) {
    notes.push(`DuplicateErrors[${duplicateCount}]`);
  }
  if (unexpectedErrorsCount) {
    notes.push(`UnexpectedErrors[${unexpectedErrorsCount}]`);
  }
  return `SaveResults: ${notes.join(" || ")}`;
}
