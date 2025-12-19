import { getNode } from "@/background/nodes/nodes-get";
import { getErrorMsg } from "@/background/utils/errors";
import { onMessage } from "@/messaging-wrapper";

onMessage("nodes/get", (payload, sender, sendResponse) => {
  getNode(payload.id)
    .then((node) => {
      sendResponse({ success: true, data: node, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while getting the feed/folder data.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});
