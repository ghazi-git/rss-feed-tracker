import { createFolder } from "@/background/folders/folders-create";
import { deleteFolder } from "@/background/folders/folders-delete";
import { getFolder } from "@/background/folders/folders-get";
import { getFolderOptions } from "@/background/folders/folders-options";
import { updateFolder } from "@/background/folders/folders-update";
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

onMessage("folders/get", (payload, sender, sendResponse) => {
  getFolder(payload.id)
    .then((folderData) => {
      sendResponse({ success: true, data: folderData, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while getting the folder data.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("folders/update", (payload, sender, sendResponse) => {
  const { id, name, parentFolder } = payload;
  updateFolder(id, name, parentFolder)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while updating the folder.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("folders/delete", (payload, sender, sendResponse) => {
  deleteFolder(payload.id)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while deleting the folder.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});
