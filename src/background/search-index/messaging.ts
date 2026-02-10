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
