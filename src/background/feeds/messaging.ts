import { loadAndCreateFeed } from "@/background/feeds/feed-create";
import { deleteFeed } from "@/background/feeds/feeds-delete";
import { getFeed } from "@/background/feeds/feeds-get";
import { previewFeed } from "@/background/feeds/feeds-preview";
import { updateFeed } from "@/background/feeds/feeds-update";
import { getBookmarks } from "@/background/feeds/posts-get-bookmarks";
import { getUnreadBookmarksCount } from "@/background/feeds/posts-get-unread-bookmarks-count";
import { toggleUnreadPost } from "@/background/feeds/posts-toggle-unread";
import { getErrorMsg } from "@/background/utils/errors";
import { onMessage } from "@/messaging-wrapper";

onMessage("feeds/preview", (payload, sender, sendResponse) => {
  previewFeed(payload.url)
    .then((data) => {
      sendResponse({ success: true, data, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while previewing the feed posts.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("feeds/create", (payload, sender, sendResponse) => {
  loadAndCreateFeed(payload)
    .then((feedId) => {
      sendResponse({ success: true, data: { feedId }, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while creating the feed.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("feeds/get", (payload, sender, sendResponse) => {
  getFeed(payload.id)
    .then((feedData) => {
      sendResponse({ success: true, data: feedData, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while getting the feed data.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("feeds/update", (payload, sender, sendResponse) => {
  const { id, ...feedData } = payload;
  updateFeed(id, feedData)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while updating the feed.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("feeds/delete", (payload, sender, sendResponse) => {
  deleteFeed(payload.id)
    .then(() => {
      sendResponse({ success: true, data: undefined, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while deleting the feed.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage(
  "posts/get-unread-bookmarks-count",
  (payload, sender, sendResponse) => {
    getUnreadBookmarksCount()
      .then((count) => {
        sendResponse({ success: true, data: count, errorMsg: null });
      })
      .catch((err) => {
        const defaultMsg =
          "An unexpected error occurred while getting the unread bookmarks count.";
        const errorMsg = getErrorMsg(err, defaultMsg);
        sendResponse({ success: false, data: null, errorMsg });
      });
    return true;
  },
);

onMessage("posts/get-bookmarks", (payload, sender, sendResponse) => {
  getBookmarks(payload.postsView, payload.cursor)
    .then((resp) => {
      sendResponse({ success: true, data: resp, errorMsg: null });
    })
    .catch((err) => {
      const defaultMsg =
        "An unexpected error occurred while getting the bookmarked posts.";
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});

onMessage("posts/toggle-unread", (payload, sender, sendResponse) => {
  toggleUnreadPost(payload.feedId, payload.guid, payload.unread)
    .then((resp) => {
      sendResponse({ success: true, data: resp, errorMsg: null });
    })
    .catch((err) => {
      const markingAs = payload.unread
        ? "marking the post as unread."
        : "marking the post as read.";
      const defaultMsg = `An unexpected error occurred while ${markingAs}`;
      const errorMsg = getErrorMsg(err, defaultMsg);
      sendResponse({ success: false, data: null, errorMsg });
    });
  return true;
});
