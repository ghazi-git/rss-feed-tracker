import { Feed, Post } from "@/db-setup";
import { FeedPost } from "@/messaging-wrapper";

export function addFeedData(feeds: Feed[], posts: Post[]): FeedPost[] {
  const feedEntries = feeds.map((f) => [f.id, f] as const);
  const feedMap = new Map(feedEntries);
  return posts.map((post) => {
    const f = feedMap.get(post.feedId);
    const feedName = f ? f.name : "Deleted Feed";
    const feedFavicon = f ? f.feed.favicon : null;
    return { ...post, feedName, feedFavicon };
  });
}
