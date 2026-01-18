import { triggerBackup } from "@/background/import-export/full-data-trigger-backup";
import { importOPML } from "@/background/import-export/opml-import";
import { triggerOPMLExport } from "@/background/import-export/opml-trigger-export";
import { triggerRootExport } from "@/background/import-export/opml-trigger-root-export";
import { getErrorMsg } from "@/background/utils/errors";
import { onMessage } from "@/messaging-wrapper";

onMessage("opml/import", (payload, sender, sendResponse) => {
  importOPML(payload.fileContent, payload.folder)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while importing the feeds.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("opml/trigger-export", (payload, sender, sendResponse) => {
  triggerOPMLExport(payload.folder)
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

onMessage("opml/trigger-root-export", (payload, sender, sendResponse) => {
  triggerRootExport()
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

onMessage("full-data/backup-trigger", (payload, sender, sendResponse) => {
  triggerBackup()
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
