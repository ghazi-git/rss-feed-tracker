import { setupOffscreenDocument } from "@/background/utils/offscreen";
import {
  getSearchIndexRebuildingProgress,
  saveSearchIndexName,
} from "@/background/utils/search";
import { sendMessage } from "@/messaging-wrapper";
import { SEARCH_INDEX_DEFAULT_STORE } from "@/utils/settings";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    await saveSearchIndexName(SEARCH_INDEX_DEFAULT_STORE);
  } else if (reason === "update") {
    await resumeSearchIndexRebuilding();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await resumeSearchIndexRebuilding();
});

async function resumeSearchIndexRebuilding() {
  const params = await getSearchIndexRebuildingProgress();
  if (params) {
    await setupOffscreenDocument("Build a search index");
    sendMessage("search-index/resume-rebuild", params);
  }
}
