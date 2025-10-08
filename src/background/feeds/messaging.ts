import { loadAndCreateFeed } from "@/background/feeds/feed-create";
import { getFeed } from "@/background/feeds/feeds-get";
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

onMessage("feeds/add", (payload, sender, sendResponse) => {
  loadAndCreateFeed(payload)
    .then((feedId) => {
      sendResponse({ success: true, data: { feedId }, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});

onMessage("feeds/get", (payload, sender, sendResponse) => {
  getFeed(payload.id)
    .then((feedData) => {
      sendResponse({ success: true, data: feedData, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});
