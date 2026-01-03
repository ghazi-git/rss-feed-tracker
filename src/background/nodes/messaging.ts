import { getNodeForNodePage } from "@/background/nodes/nodes-get-for-node-page";
import { getNodeForNodePostsPage } from "@/background/nodes/nodes-get-for-node-posts-page";
import { getErrorMsg } from "@/background/utils/errors";
import { onMessage } from "@/messaging-wrapper";

onMessage("nodes/get-for-node-page", (payload, sender, sendResponse) => {
  getNodeForNodePage(payload.id)
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

onMessage("nodes/get-for-node-posts-page", (payload, sender, sendResponse) => {
  getNodeForNodePostsPage(payload.id)
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
