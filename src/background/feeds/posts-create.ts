import { ExtensionDB, Post } from "@/background/db-setup";
import { ParsedPost } from "@/background/feeds/fetch";
import { bulkAdd } from "@/background/utils/idb-helpers";

export async function savePosts(
  db: ExtensionDB,
  feedId: number,
  parsedPosts: ParsedPost[],
  fetchTime: number,
) {
  const posts: Post[] = parsedPosts.map((post) => ({
    ...post,
    unread: 0,
    bookmarked: 0,
    feedId,
    receivedAt: fetchTime,
  }));
  return await bulkAdd(db, "posts", posts);
}
