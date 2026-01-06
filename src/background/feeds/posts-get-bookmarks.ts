import { getDBConnection, Post, ReadTX } from "@/background/db-setup";
import { getAllFromIndex } from "@/background/utils/idb-helpers";
import {
  addFeedData,
  getNextPageCursor,
  getPostsFromIndex,
} from "@/background/utils/posts";
import { PostsCursor, PostsResponse, PostsView } from "@/messaging-wrapper";

export async function getBookmarks(
  postsView: PostsView,
  cursor: PostsCursor | null,
): Promise<PostsResponse> {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["posts", "nodes"]);

  let posts: Post[];
  if (postsView === "unread" && cursor) {
    const lower = [1, 1];
    const upper = [1, 1, cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    posts = await getPostsFromIndex(
      tx,
      "by_bookmarked_unread_published_at_feed_id_guid",
      query,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1, 1]);
    posts = await getPostsFromIndex(
      tx,
      "by_bookmarked_unread_published_at_feed_id_guid",
      query,
    );
  } else if (cursor) {
    const lower = [1];
    const upper = [1, cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    posts = await getPostsFromIndex(
      tx,
      "by_bookmarked_published_at_feed_id_guid",
      query,
    );
  } else {
    const query = IDBKeyRange.lowerBound([1]);
    posts = await getPostsFromIndex(
      tx,
      "by_bookmarked_published_at_feed_id_guid",
      query,
    );
  }

  const feeds = await getFeeds(tx);
  const feedPosts = addFeedData(feeds, posts);
  const nextPageCursor = getNextPageCursor(feedPosts);
  return { posts: feedPosts, postsView, cursor, nextPageCursor };
}

async function getFeeds(tx: ReadTX) {
  const nodes = await getAllFromIndex(tx, "nodes", "by_type", {
    query: "feed",
  });
  return nodes.filter((n) => n.type === "feed");
}
