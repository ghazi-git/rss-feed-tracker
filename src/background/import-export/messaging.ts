import { exportOPML } from "@/background/import-export/opml-export";
import { importOPML } from "@/background/import-export/opml-import";
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

onMessage("opml/export", (payload, sender, sendResponse) => {
  exportOPML(payload.folder)
    .then((fileContent) => {
      sendResponse({ success: true, data: fileContent, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while exporting the feeds.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});
