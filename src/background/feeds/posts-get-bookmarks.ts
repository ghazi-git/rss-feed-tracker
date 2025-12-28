import { getDBConnection, Post } from "@/background/db-setup";
import { PAGE_SIZE } from "@/background/settings";
import { addFeedData, getNextPageCursor } from "@/background/utils/posts";
import { PostsCursor, PostsResponse, PostsView } from "@/messaging-wrapper";

export async function getBookmarks(
  postsView: PostsView,
  cursor: PostsCursor | null,
): Promise<PostsResponse> {
  using conn = await getDBConnection();
  let posts: Post[];
  if (postsView === "unread" && cursor) {
    const lower = [1, 1];
    const upper = [1, 1, cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    posts = await conn.db.getAllFromIndex(
      "posts",
      "by_bookmarked_unread_published_at_feed_id_guid",
      { query, direction: "prev", count: PAGE_SIZE },
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1, 1]);
    posts = await conn.db.getAllFromIndex(
      "posts",
      "by_bookmarked_unread_published_at_feed_id_guid",
      { query, direction: "prev", count: PAGE_SIZE },
    );
  } else if (cursor) {
    const lower = [1];
    const upper = [1, cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    posts = await conn.db.getAllFromIndex(
      "posts",
      "by_bookmarked_published_at_feed_id_guid",
      { query, direction: "prev", count: PAGE_SIZE },
    );
  } else {
    const query = IDBKeyRange.lowerBound([1]);
    posts = await conn.db.getAllFromIndex(
      "posts",
      "by_bookmarked_published_at_feed_id_guid",
      { query, direction: "prev", count: PAGE_SIZE },
    );
  }

  const feedPosts = await addFeedData(conn.db, posts);
  const nextPageCursor = getNextPageCursor(feedPosts);
  return { posts: feedPosts, postsView, cursor, nextPageCursor };
}
