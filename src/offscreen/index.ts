import { onMessage } from "@/messaging-wrapper";
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
