import { createFolder } from "@/background/folders/folders-create";
import { getFolderOptions } from "@/background/folders/folders-options";
import { getErrorMsg } from "@/background/utils/errors";
import { onMessage } from "@/messaging-wrapper";

onMessage("folders/create", (payload, sender, sendResponse) => {
  createFolder(payload)
    .then((folderId) => {
      sendResponse({ success: true, data: { folderId }, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while creating the folder.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("folders/options", (payload, sender, sendResponse) => {
  getFolderOptions()
    .then((options) => {
      sendResponse({ success: true, data: options, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while getting the folders tree.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});
