import { previewFeed } from "@/background/feeds/preview";
import { onMessage } from "@/messaging-wrapper";

onMessage("feeds/preview", (payload, sender, sendResponse) => {
  previewFeed(payload.url)
    .then((data) => {
      sendResponse({ success: true, data, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});
