import { getNode } from "@/background/nodes/nodes-get";
import { onMessage } from "@/messaging-wrapper";

onMessage("nodes/get", (payload, sender, sendResponse) => {
  getNode(payload.id)
    .then((node) => {
      sendResponse({ success: true, data: node, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});
