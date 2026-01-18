import { onMessage } from "@/messaging-wrapper";
import { backupExtension } from "@/offscreen/backup-restore/full-data-backup";
import { getErrorMsg } from "@/offscreen/errors";
import { exportOPML } from "@/offscreen/opml-export";

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
  backupExtension()
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
