import { ExtensionDB, Post } from "@/background/db-setup";
import { PAGE_SIZE } from "@/background/settings";
import { FeedPost, PostsCursor } from "@/messaging-wrapper";

export async function addFeedData(
  db: ExtensionDB,
  posts: Post[],
): Promise<FeedPost[]> {
  const nodes = await db.getAllFromIndex("nodes", "by_type", "feed");
  const feedEntries = nodes
    .filter((n) => n.type === "feed")
    .map((f) => [f.id, f] as const);
  const feeds = new Map(feedEntries);
  return posts.map((post) => {
    const f = feeds.get(post.feedId);
    const feedName = f ? f.name : "Deleted Feed";
    const feedFavicon = f ? f.feed.favicon : null;
    return { ...post, feedName, feedFavicon };
  });
}

export function getNextPageCursor(posts: Post[]): PostsCursor | null {
  if (posts.length < PAGE_SIZE) {
    return null;
  } else {
    const lastPost = posts.at(-1) as Post;
    const { publishedAt, feedId, guid } = lastPost;
    return { publishedAt, feedId, guid };
  }
}
