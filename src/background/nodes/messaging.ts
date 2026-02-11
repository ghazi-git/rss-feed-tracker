import { getNodeForNodePage } from "@/background/nodes/nodes-get-for-node-page";
import { getNodeForNodePostsPage } from "@/background/nodes/nodes-get-for-node-posts-page";
import { getNodeOptions } from "@/background/nodes/nodes-get-options";
import { moveIntoSiblingFolder } from "@/background/nodes/nodes-move-into-sibling-folder";
import { moveRelativeToTarget } from "@/background/nodes/nodes-move-relative-to-target";
import { reloadNode } from "@/background/nodes/nodes-reload";
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

onMessage("nodes/get-options", (payload, sender, sendResponse) => {
  getNodeOptions()
    .then((options) => {
      sendResponse({ success: true, data: options, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while getting the feed/folder options.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("nodes/reload", (payload, sender, sendResponse) => {
  reloadNode(payload.id)
    .then((node) => {
      sendResponse({ success: true, data: node, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while fetching new posts.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("nodes/move-into-sibling-folder", (payload, sender, sendResponse) => {
  moveIntoSiblingFolder(payload.nodeId, payload.folderId)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while moving the feed/folder.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("nodes/move-relative-to-target", (payload, sender, sendResponse) => {
  moveRelativeToTarget(payload.nodeId, payload.targetId, payload.placement)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while moving the feed/folder.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});
