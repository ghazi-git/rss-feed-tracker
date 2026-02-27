import { getNextPageCursor, getPostsFromIndex } from "@/background/utils/posts";
import { getDBConnection, Post, ReadTX } from "@/db-setup";
import { PostsCursor, PostsResponse, PostsView } from "@/messaging-wrapper";
import { loadPreferences } from "@/utils/extension-storage";
import { getAllFromIndex } from "@/utils/idb-helpers";
import { addFeedData } from "@/utils/posts";
import { PAGE_SIZE } from "@/utils/settings";

export async function getBookmarks(
  postsView: PostsView,
  cursor: PostsCursor | null,
  pageSize: number | undefined,
): Promise<PostsResponse> {
  const preferences = await loadPreferences();
  const orderBy = preferences.orderPostsBy;

  using conn = await getDBConnection();
  const tx = conn.db.transaction(["posts", "nodes"]);

  pageSize = pageSize ? Math.max(pageSize, PAGE_SIZE) : PAGE_SIZE;
  let posts: Post[];
  if (postsView === "unread" && cursor) {
    const lower = [1, 1];
    const upper = [1, 1, cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    posts = await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_bookmarked_unread_fetched_at_feed_id_guid"
        : "by_bookmarked_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1, 1]);
    posts = await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_bookmarked_unread_fetched_at_feed_id_guid"
        : "by_bookmarked_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (cursor) {
    const lower = [1];
    const upper = [1, cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    posts = await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_bookmarked_fetched_at_feed_id_guid"
        : "by_bookmarked_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else {
    const query = IDBKeyRange.lowerBound([1]);
    posts = await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_bookmarked_fetched_at_feed_id_guid"
        : "by_bookmarked_published_at_feed_id_guid",
      query,
      pageSize,
    );
  }

  const feeds = await getFeeds(tx);
  const feedPosts = addFeedData(feeds, posts);
  const nextPageCursor = getNextPageCursor(feedPosts, pageSize, orderBy);
  return { posts: feedPosts, nextPageCursor };
}

async function getFeeds(tx: ReadTX) {
  const nodes = await getAllFromIndex(tx, "nodes", "by_type", {
    query: "feed",
  });
  return nodes.filter((n) => n.type === "feed");
}
