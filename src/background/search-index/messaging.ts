import { finishRebuildingSearchIndex } from "@/background/search-index/search-index-finish-rebuild";
import { isRebuildingSearchIndex } from "@/background/search-index/search-index-is-rebuild-in-progress";
import { storeRebuildingProgress } from "@/background/search-index/search-index-store-rebuild-progress";
import { triggerSearchQuery } from "@/background/search-index/search-index-trigger-query";
import { triggerRebuildSearchIndex } from "@/background/search-index/search-index-trigger-rebuild";
import { getErrorMsg } from "@/background/utils/errors";
import { onMessage } from "@/messaging-wrapper";
import { resumeRebuildingSearchIndex } from "@/offscreen/search-index/search-index-resume-rebuild";

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

onMessage(
  "search-index/is-rebuild-in-progress",
  (payload, sender, sendResponse) => {
    isRebuildingSearchIndex()
      .then((inProgress) => {
        sendResponse({ success: true, data: inProgress, errorMsg: null });
      })
      .catch((err) => {
        const defaultMsg =
          "An unexpected error occurred while checking if the search index rebuilding is in progress.";
        const errorMsg = getErrorMsg(err, defaultMsg);
        sendResponse({ success: false, data: null, errorMsg });
      });
    return true;
  },
);

onMessage(
  "search-index/store-rebuild-progress",
  (payload, sender, sendResponse) => {
    storeRebuildingProgress(payload)
      .then(() => {
        sendResponse({ success: true, data: undefined, errorMsg: null });
      })
      .catch((err) => {
        const defaultMsg =
          "An unexpected error occurred while saving the search index rebuilding progress.";
        const errorMsg = getErrorMsg(err, defaultMsg);
        sendResponse({ success: false, data: null, errorMsg });
      });
    return true;
  },
);

onMessage("search-index/finish-rebuild", (payload, sender, sendResponse) => {
  finishRebuildingSearchIndex(payload.indexName, payload.initialCursor)
    .then((oldIndexName) => {
      sendResponse({ success: true, data: oldIndexName, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while rebuilding the search index.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("search-index/resume-rebuild", (payload, sender, sendResponse) => {
  resumeRebuildingSearchIndex(payload)
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
