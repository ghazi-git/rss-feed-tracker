import { onMessage } from "@/messaging-wrapper";
import { backupExtension } from "@/offscreen/backup-restore/full-data-backup";
import { restoreExtension } from "@/offscreen/backup-restore/full-data-restore";
import { getErrorMsg } from "@/offscreen/errors";
import { exportOPML } from "@/offscreen/opml-export";
import { querySearchIndex } from "@/offscreen/search-index/search-index-query";
import { rebuildSearchIndex } from "@/offscreen/search-index/search-index-rebuild";
import { resumeRebuildingSearchIndex } from "@/offscreen/search-index/search-index-resume-rebuild";
import { updateSearchIndex } from "@/offscreen/search-index/search-index-update";

onMessage("opml/export", (payload, sender, sendResponse) => {
  exportOPML(payload.folder)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while exporting the feeds.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("full-data/backup", (payload, sender, sendResponse) => {
  backupExtension(payload)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while creating the backup.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("full-data/restore", (payload, sender, sendResponse) => {
  restoreExtension(payload.fileURL)
    .then((preferences) => {
      sendResponse({ success: true, data: preferences, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while restoring the extension data from the backup.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("search-index/rebuild", (payload, sender, sendResponse) => {
  rebuildSearchIndex()
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

onMessage("search-index/update", (payload, sender, sendResponse) => {
  updateSearchIndex(payload.indexName)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while updating the search index.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage(
  "search-index/query",
  ({ timeField, indexName, ...params }, sender, sendResponse) => {
    querySearchIndex(params, timeField, indexName)
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
  },
);
