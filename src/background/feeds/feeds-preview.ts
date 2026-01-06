import {
  fetchFeedContent,
  parseFeedContent,
} from "@/background/utils/feeds-fetch-from-source";
import { FeedPreviewResponse } from "@/messaging-wrapper";

/**
 * get the latest 3 posts from the provided feed URL
 * @raises FeedParseError, HttpError
 */
export async function previewFeed(url: string): Promise<FeedPreviewResponse> {
  const feedContent = await fetchFeedContent(url);
  const feed = parseFeedContent(url, feedContent);
  return {
    feedName: feed.name,
    posts: feed.posts.slice(0, 3).map(({ title, url, publishedAt }) => ({
      title,
      url,
      publishedAt,
    })),
  };
}
