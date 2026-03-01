import { Post, SearchIndexOperation, SearchIndexRemove } from "@/db-setup";
import {
  SearchIndexProgressCursor,
  SearchIndexProgressParams,
} from "@/messaging-wrapper";
import {
  SEARCH_INDEX_REBUILDING_ALARM,
  SEARCH_INDEXING_ALARM,
} from "@/utils/settings";

export async function saveSearchIndexRebuildingProgress(
  params: SearchIndexProgressParams,
) {
  await chrome.storage.local.set({ searchIndexProgress: params });
}

export async function removeSearchIndexRebuildingProgress() {
  await chrome.storage.local.remove("searchIndexProgress");
}

export async function getSearchIndexRebuildingProgress() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { searchIndexProgress }: { searchIndexProgress: any } =
    await chrome.storage.local.get("searchIndexProgress");
  if (
    searchIndexProgress &&
    typeof searchIndexProgress.indexName === "string" &&
    typeof searchIndexProgress.startTime === "number" &&
    isProgressCursor(searchIndexProgress.currentCursor) &&
    isProgressCursor(searchIndexProgress.initialCursor)
  ) {
    return searchIndexProgress as SearchIndexProgressParams;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isProgressCursor(obj: any): obj is SearchIndexProgressCursor {
  return (
    typeof obj.fetchedAt === "number" &&
    typeof obj.feedId === "number" &&
    typeof obj.guid === "string"
  );
}

export async function saveSearchIndexName(name: string) {
  await chrome.storage.local.set({ searchIndexName: name });
}

export async function getSearchIndexName() {
  const { searchIndexName } = await chrome.storage.local.get("searchIndexName");
  return typeof searchIndexName === "string" && searchIndexName
    ? searchIndexName
    : null;
}

export async function scheduleSearchIndexing() {
  // run indexing in 30s because that the earliest an alarm can be scheduled
  await chrome.alarms.create(SEARCH_INDEXING_ALARM, {
    when: Date.now() + 30_000,
  });
}

export async function scheduleSearchIndexRebuilding() {
  // run indexing in 30s because that the earliest an alarm can be scheduled
  await chrome.alarms.create(SEARCH_INDEX_REBUILDING_ALARM, {
    when: Date.now() + 30_000,
  });
}

export async function removeSearchIndexAlarms() {
  await Promise.all([
    chrome.alarms.clear(SEARCH_INDEXING_ALARM),
    chrome.alarms.clear(SEARCH_INDEX_REBUILDING_ALARM),
  ]);
}

export function getAddOrUpdateOperation(
  post: Post,
  operation: "add" | "update",
) {
  return {
    feedId: post.feedId,
    guid: post.guid,
    createdAt: Date.now(),
    operation,
    document: {
      title: post.title,
      bookmarked: post.bookmarked,
      publishedAt: post.publishedAt,
      fetchedAt: post.fetchedAt,
    },
  } as SearchIndexOperation;
}

export function getRemoveOperation(feedId: number, guid: string) {
  return {
    feedId,
    guid,
    createdAt: Date.now(),
    operation: "remove",
    document: null,
  } as SearchIndexRemove;
}
