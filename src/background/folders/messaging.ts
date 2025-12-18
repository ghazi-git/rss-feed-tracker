import { createFolder } from "@/background/folders/folders-create";
import { getFolderOptions } from "@/background/folders/folders-options";
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

onMessage("folders/options", (payload, sender, sendResponse) => {
  getFolderOptions()
    .then((options) => {
      sendResponse({ success: true, data: options, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});
