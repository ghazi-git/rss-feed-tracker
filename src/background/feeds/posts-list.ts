import { IndexNames } from "idb";

import { NotFoundError } from "@/background/utils/errors";
import { getChildFeedIds } from "@/background/utils/nodes";
import {
  addFeedData,
  getNextPageCursor,
  getPostsFromIndex,
} from "@/background/utils/posts";
import { FeedTrackerDB, getDBConnection, Post, ReadTX } from "@/db-setup";
import { getAllFromIndex } from "@/idb-helpers";
import {
  FeedPost,
  PostsCursor,
  PostsResponse,
  PostsView,
} from "@/messaging-wrapper";
import { PAGE_SIZE } from "@/settings";

export async function listPosts(
  nodeId: number,
  postsView: PostsView,
  cursor: PostsCursor | null,
): Promise<PostsResponse> {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["posts", "nodes"]);

  const nodeStore = tx.objectStore("nodes");
  const node = await nodeStore.get(nodeId);
  if (!node) {
    throw new NotFoundError(
      "Unable to find the feed/folder, it may have been deleted.",
      { cause: `posts-list: failure to get the node id=${nodeId}` },
    );
  }

  let feedPosts: FeedPost[];
  if (node.type === "feed") {
    const posts = await getFeedPosts(tx, nodeId, postsView, cursor);
    const feeds = await getFeeds(tx);
    feedPosts = addFeedData(feeds, posts);
  } else if (!node.parentId) {
    const posts = await getRootFolderPosts(tx, postsView, cursor);
    const feeds = await getFeeds(tx);
    feedPosts = addFeedData(feeds, posts);
  } else {
    // determine the feeds in the folder, open cursor then pick up posts
    const allNodes = await nodeStore.getAll();
    const feedIds = getChildFeedIds(node, allNodes);
    const posts = await getFolderPosts(tx, feedIds, postsView, cursor);

    const feeds = allNodes.filter((n) => n.type === "feed");
    feedPosts = addFeedData(feeds, posts);
  }

  const nextPageCursor = getNextPageCursor(feedPosts);
  return { posts: feedPosts, nextPageCursor };
}

async function getFeedPosts(
  tx: ReadTX,
  feedId: number,
  postsView: PostsView,
  cursor: PostsCursor | null,
) {
  if (postsView === "unread" && cursor) {
    const lower = [1, feedId];
    const upper = [1, feedId, cursor.publishedAt, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsFromIndex(
      tx,
      "by_unread_feed_id_published_at_guid",
      query,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.bound([1, feedId], [1, feedId + 1], false, true);
    return await getPostsFromIndex(
      tx,
      "by_unread_feed_id_published_at_guid",
      query,
    );
  } else if (cursor) {
    const lower = [feedId];
    const upper = [feedId, cursor.publishedAt, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsFromIndex(tx, "by_feed_id_published_at_guid", query);
  } else {
    const query = IDBKeyRange.bound([feedId], [feedId + 1], false, true);
    return await getPostsFromIndex(tx, "by_feed_id_published_at_guid", query);
  }
}

async function getRootFolderPosts(
  tx: ReadTX,
  postsView: PostsView,
  cursor: PostsCursor | null,
) {
  if (postsView === "unread" && cursor) {
    const lower = [1];
    const upper = [1, cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsFromIndex(
      tx,
      "by_unread_published_at_feed_id_guid",
      query,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1]);
    return await getPostsFromIndex(
      tx,
      "by_unread_published_at_feed_id_guid",
      query,
    );
  } else if (cursor) {
    const upper = [cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.upperBound(upper, true);
    return await getPostsFromIndex(tx, "by_published_at_feed_id_guid", query);
  } else {
    return await getPostsFromIndex(tx, "by_published_at_feed_id_guid", null);
  }
}

async function getFeeds(tx: ReadTX) {
  const nodes = await getAllFromIndex(tx, "nodes", "by_type", {
    query: "feed",
  });
  return nodes.filter((n) => n.type === "feed");
}

async function getFolderPosts(
  tx: ReadTX,
  feedIds: Set<number>,
  postsView: PostsView,
  cursor: PostsCursor | null,
) {
  if (postsView === "unread" && cursor) {
    const lower = [1];
    const upper = [1, cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      "by_unread_published_at_feed_id_guid",
      query,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1]);
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      "by_unread_published_at_feed_id_guid",
      query,
    );
  } else if (cursor) {
    const upper = [cursor.publishedAt, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.upperBound(upper, true);
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      "by_published_at_feed_id_guid",
      query,
    );
  } else {
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      "by_published_at_feed_id_guid",
      null,
    );
  }
}

async function getPostsUsingIndexCursor(
  feedIds: Set<number>,
  tx: ReadTX,
  indexName: IndexNames<FeedTrackerDB, "posts">,
  query: IDBKeyRange | null,
) {
  const posts: Post[] = [];
  const store = tx.objectStore("posts");
  const index = store.index(indexName);
  let cursor = await index.openCursor(query, "prev");
  while (cursor && posts.length < PAGE_SIZE) {
    const post = cursor.value;
    if (feedIds.has(post.feedId)) {
      posts.push(post);
    }
    cursor = await cursor.continue();
  }

  return posts;
}
