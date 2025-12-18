import { createFolder } from "@/background/folders/folders-create";
import { onMessage } from "@/messaging-wrapper";

onMessage("folders/create", (payload, sender, sendResponse) => {
  createFolder(payload)
    .then((folderId) => {
      sendResponse({ success: true, data: { folderId }, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});
