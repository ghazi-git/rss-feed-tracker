import { setupOffscreenDocument } from "@/background/utils/offscreen";
import {
  getSearchIndexName,
  getSearchIndexRebuildingProgress,
  saveSearchIndexName,
} from "@/background/utils/search";
import { getDBConnection } from "@/db-setup";
import { sendMessage } from "@/messaging-wrapper";
import {
  SEARCH_INDEX_DEFAULT_STORE,
  SEARCH_INDEX_REBUILDING_ALARM,
  SEARCH_INDEXING_ALARM,
} from "@/utils/settings";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    await saveSearchIndexName(SEARCH_INDEX_DEFAULT_STORE);
  } else if (reason === "update") {
    if (await hasIndexingOperations()) {
      await triggerIndexing();
    }
    await resumeSearchIndexRebuilding();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  if (await hasIndexingOperations()) {
    await triggerIndexing();
  }
  await resumeSearchIndexRebuilding();
});

async function resumeSearchIndexRebuilding() {
  const params = await getSearchIndexRebuildingProgress();
  if (params) {
    await setupOffscreenDocument("Build a search index");
    sendMessage("search-index/resume-rebuild", params);
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SEARCH_INDEXING_ALARM) {
    await triggerIndexing();
  } else if (alarm.name === SEARCH_INDEX_REBUILDING_ALARM) {
    await resumeSearchIndexRebuilding();
  }
});

async function triggerIndexing() {
  await setupOffscreenDocument("Add documents to the search index");
  const indexName = await getSearchIndexName();
  if (indexName) {
    sendMessage("search-index/update", { indexName });
  } else {
    // sth is wrong with the search index since we're unable to find it in the
    // extension storage. So, use the default search index name and trigger the
    // rebuilding of a new index
    await saveSearchIndexName(SEARCH_INDEX_DEFAULT_STORE);
    sendMessage("search-index/update", {
      indexName: SEARCH_INDEX_DEFAULT_STORE,
    });
    sendMessage("search-index/rebuild", undefined);
  }
}

async function hasIndexingOperations() {
  using conn = await getDBConnection();
  const keys = await conn.db.getAllKeys("searchIndexOperations", { count: 1 });
  return keys.length > 0;
}
