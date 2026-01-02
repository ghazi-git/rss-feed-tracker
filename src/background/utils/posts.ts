import { unwrap } from "idb";

import { ExtensionDB, Post, ReadWriteTX } from "@/background/db-setup";
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

/**
 * @returns results of the addition for each object (success or not). If the
 * addition fails, it returns the error name. Tolerating failures of inserting
 * some posts is helpful when we want to ignore the ConstraintErrors due to
 * adding duplicate posts.
 */
export async function bulkAddPosts(tx: ReadWriteTX, posts: Post[]) {
  const store = unwrap(tx.objectStore("posts"));

  const addPromises = posts.map((obj) => {
    return new Promise<PostAddResult>((resolve) => {
      const addRequest = store.add(obj);
      addRequest.onsuccess = () =>
        resolve({ success: true, item: obj, errorName: null });
      addRequest.onerror = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const error = addRequest.error as DOMException;
        resolve({ success: false, item: obj, errorName: error.name });
      };
    });
  });
  return await Promise.all(addPromises);
}

export function describeSaveResults(results: PostAddResult[]) {
  const failed = results.filter((res) => !res.success);
  if (!failed.length) return null;

  const duplicateCount = failed.filter(
    (res) => res.errorName === "ConstraintError",
  ).length;
  const unexpectedErrorsCount = failed.length - duplicateCount;
  const notes: string[] = [`TotalPosts[${results.length}]`];
  if (duplicateCount) {
    notes.push(`DuplicateErrors[${duplicateCount}]`);
  }
  if (unexpectedErrorsCount) {
    notes.push(`UnexpectedErrors[${unexpectedErrorsCount}]`);
  }
  return `SaveResults: ${notes.join(" || ")}`;
}

type PostAddResult =
  | { success: true; item: Post; errorName: null }
  | { success: false; item: Post; errorName: string };
