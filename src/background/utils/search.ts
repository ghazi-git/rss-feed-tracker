import { Post, SearchIndexOperation, SearchIndexRemove } from "@/db-setup";
import {
  SearchIndexProgressCursor,
  SearchIndexProgressParams,
} from "@/messaging-wrapper";

export async function saveSearchIndexRebuildingProgress(
  params: SearchIndexProgressParams,
) {
  await chrome.storage.local.set({ searchIndexProgress: params });
}

export async function removeSearchIndexRebuildingProgress() {
  await chrome.storage.local.remove("searchIndexProgress");
}

export async function getSearchIndexRebuildingProgress(): Promise<SearchIndexProgressParams | null> {
  const { searchIndexProgress } = await chrome.storage.local.get(
    "searchIndexProgress",
  );
  if (
    searchIndexProgress &&
    typeof searchIndexProgress.indexName === "string" &&
    typeof searchIndexProgress.startTime === "number" &&
    isProgressCursor(searchIndexProgress.currentCursor) &&
    isProgressCursor(searchIndexProgress.initialCursor)
  ) {
    return searchIndexProgress;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isProgressCursor(obj: any): obj is SearchIndexProgressCursor {
  return (
    typeof obj.receivedAt === "number" &&
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
  await chrome.alarms.create("search-indexing", { when: Date.now() + 30_000 });
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
      receivedAt: post.receivedAt,
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
