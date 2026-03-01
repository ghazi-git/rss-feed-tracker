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
    await triggerIndexing();
    await resumeSearchIndexRebuilding();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await triggerIndexing();
  await resumeSearchIndexRebuilding();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SEARCH_INDEXING_ALARM) {
    await triggerIndexing();
  } else if (alarm.name === SEARCH_INDEX_REBUILDING_ALARM) {
    await resumeSearchIndexRebuilding();
  }
});

async function resumeSearchIndexRebuilding() {
  const params = await getSearchIndexRebuildingProgress();
  if (params) {
    await setupOffscreenDocument("Build a search index");
    sendMessage("search-index/resume-rebuild", params);
  }
}

async function triggerIndexing() {
  if (await hasIndexingOperations()) {
    await setupOffscreenDocument("Add documents to the search index");
    const indexName = await getSearchIndexName();
    if (indexName) {
      sendMessage("search-index/update", { indexName });
    }
  }
}

async function hasIndexingOperations() {
  using conn = await getDBConnection();
  const keys = await conn.db.getAllKeys("searchIndexOperations", { count: 1 });
  return keys.length > 0;
}
