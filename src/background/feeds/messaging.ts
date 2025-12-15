import { loadAndCreateFeed } from "@/background/feeds/feed-create";
import { deleteFeed } from "@/background/feeds/feeds-delete";
import { getFeed } from "@/background/feeds/feeds-get";
import { previewFeed } from "@/background/feeds/feeds-preview";
import { updateFeed } from "@/background/feeds/feeds-update";
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

onMessage("feeds/create", (payload, sender, sendResponse) => {
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

onMessage("feeds/update", (payload, sender, sendResponse) => {
  const { id, ...feedData } = payload;
  updateFeed(id, feedData)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});

onMessage("feeds/delete", (payload, sender, sendResponse) => {
  deleteFeed(payload.id)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});
