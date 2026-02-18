import { saveSearchIndexName } from "@/background/utils/search";
import { SEARCH_INDEX_DEFAULT_STORE } from "@/utils/settings";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    await saveSearchIndexName(SEARCH_INDEX_DEFAULT_STORE);
  }
});
