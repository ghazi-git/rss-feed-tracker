import { triggerSearchQuery } from "@/background/search-index/search-index-trigger-query";
import { triggerRebuildSearchIndex } from "@/background/search-index/search-index-trigger-rebuild";
import { getErrorMsg } from "@/background/utils/errors";
import { onMessage } from "@/messaging-wrapper";

onMessage("search-index/trigger-rebuild", (payload, sender, sendResponse) => {
  triggerRebuildSearchIndex()
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while rebuilding the search index.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("search-index/trigger-query", (payload, sender, sendResponse) => {
  triggerSearchQuery(payload)
    .then((results) => {
      sendResponse({ success: true, data: results, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while performing the search.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});
