import { fetchFeedContent, parseFeedContent } from "@/background/feeds/fetch";
import { onMessage } from "@/messaging-wrapper";

onMessage("feeds/preview", (payload, sender, sendResponse) => {
  fetchFeedContent(payload.url)
    .then((feedContent) => {
      const feed = parseFeedContent(payload.url, feedContent);
      const data = {
        feedName: feed.name,
        posts: feed.posts.slice(0, 3).map(({ title, url, publishedAt }) => ({
          title,
          url,
          publishedAt,
        })),
      };
      sendResponse({ success: true, data, errorMsg: null });
    })
    .catch((reason: Error) => {
      sendResponse({ success: false, data: null, errorMsg: reason.message });
    });
  return true;
});
