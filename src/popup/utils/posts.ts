import { FeedPost } from "@/messaging-wrapper";
import { getChunks } from "@/utils/chunks";
import { PAGE_SIZE } from "@/utils/settings";

export function getGroupedPosts<T extends FeedPost>(
  posts: T[],
  orderByFetchedAt: boolean,
) {
  const chunks = getChunks(posts, PAGE_SIZE);
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const result: T[] = [];
  for (const chunk of chunks) {
    chunk.sort((p1, p2) => {
      const res = collator.compare(p1.feedName, p2.feedName);
      if (res !== 0) return res;

      return orderByFetchedAt
        ? p2.fetchedAt - p1.fetchedAt
        : p2.publishedAt - p1.publishedAt;
    });
    result.push(...chunk);
  }
  return result;
}
