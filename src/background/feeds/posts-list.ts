import { IndexNames } from "idb";

import { NotFoundError } from "@/background/utils/errors";
import { getNextPageCursor, getPostsFromIndex } from "@/background/utils/posts";
import { FeedTrackerDB, getDBConnection, Post, ReadTX } from "@/db-setup";
import {
  FeedPost,
  PostsCursor,
  PostsResponse,
  PostsView,
} from "@/messaging-wrapper";
import { loadPreferences, OrderPostsBy } from "@/utils/extension-storage";
import { getAllFromIndex } from "@/utils/idb-helpers";
import { getChildFeedIds } from "@/utils/nodes";
import { addFeedData } from "@/utils/posts";
import { PAGE_SIZE } from "@/utils/settings";

export async function listPosts(
  nodeId: number,
  postsView: PostsView,
  cursor: PostsCursor | null,
  pageSize: number | undefined,
): Promise<PostsResponse> {
  const preferences = await loadPreferences();
  const orderBy = preferences.orderPostsBy;

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

  pageSize = pageSize ? Math.max(pageSize, PAGE_SIZE) : PAGE_SIZE;
  pageSize = pageSize ?? PAGE_SIZE;
  let feedPosts: FeedPost[];
  if (node.type === "feed") {
    const posts = await getFeedPosts(
      tx,
      nodeId,
      postsView,
      cursor,
      pageSize,
      orderBy,
    );
    const feeds = await getFeeds(tx);
    feedPosts = addFeedData(feeds, posts);
  } else if (!node.parentId) {
    const posts = await getRootFolderPosts(
      tx,
      postsView,
      cursor,
      pageSize,
      orderBy,
    );
    const feeds = await getFeeds(tx);
    feedPosts = addFeedData(feeds, posts);
  } else {
    // determine the feeds in the folder, open cursor then pick up posts
    const allNodes = await nodeStore.getAll();
    const feedIds = getChildFeedIds(node, allNodes);
    const posts = await getFolderPosts(
      tx,
      feedIds,
      postsView,
      cursor,
      pageSize,
      orderBy,
    );

    const feeds = allNodes.filter((n) => n.type === "feed");
    feedPosts = addFeedData(feeds, posts);
  }

  const nextPageCursor = getNextPageCursor(feedPosts, pageSize, orderBy);
  return { posts: feedPosts, nextPageCursor };
}

async function getFeedPosts(
  tx: ReadTX,
  feedId: number,
  postsView: PostsView,
  cursor: PostsCursor | null,
  pageSize: number,
  orderBy: OrderPostsBy,
) {
  if (postsView === "unread" && cursor) {
    const lower = [1, feedId];
    const upper = [1, feedId, cursor.time, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_unread_feed_id_received_at_guid"
        : "by_unread_feed_id_published_at_guid",
      query,
      pageSize,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.bound([1, feedId], [1, feedId + 1], false, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_unread_feed_id_received_at_guid"
        : "by_unread_feed_id_published_at_guid",
      query,
      pageSize,
    );
  } else if (cursor) {
    const lower = [feedId];
    const upper = [feedId, cursor.time, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_feed_id_received_at_guid"
        : "by_feed_id_published_at_guid",
      query,
      pageSize,
    );
  } else {
    const query = IDBKeyRange.bound([feedId], [feedId + 1], false, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_feed_id_received_at_guid"
        : "by_feed_id_published_at_guid",
      query,
      pageSize,
    );
  }
}

async function getRootFolderPosts(
  tx: ReadTX,
  postsView: PostsView,
  cursor: PostsCursor | null,
  pageSize: number,
  orderBy: OrderPostsBy,
) {
  if (postsView === "unread" && cursor) {
    const lower = [1];
    const upper = [1, cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_unread_received_at_feed_id_guid"
        : "by_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1]);
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_unread_received_at_feed_id_guid"
        : "by_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (cursor) {
    const upper = [cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.upperBound(upper, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_received_at_feed_id_guid"
        : "by_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else {
    return await getPostsFromIndex(
      tx,
      orderBy === "receivedAt"
        ? "by_received_at_feed_id_guid"
        : "by_published_at_feed_id_guid",
      null,
      pageSize,
    );
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
  pageSize: number,
  orderBy: OrderPostsBy,
) {
  if (postsView === "unread" && cursor) {
    const lower = [1];
    const upper = [1, cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.bound(lower, upper, false, true);
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      orderBy === "receivedAt"
        ? "by_unread_received_at_feed_id_guid"
        : "by_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1]);
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      orderBy === "receivedAt"
        ? "by_unread_received_at_feed_id_guid"
        : "by_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (cursor) {
    const upper = [cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.upperBound(upper, true);
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      orderBy === "receivedAt"
        ? "by_received_at_feed_id_guid"
        : "by_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else {
    return await getPostsUsingIndexCursor(
      feedIds,
      tx,
      orderBy === "receivedAt"
        ? "by_received_at_feed_id_guid"
        : "by_published_at_feed_id_guid",
      null,
      pageSize,
    );
  }
}

async function getPostsUsingIndexCursor(
  feedIds: Set<number>,
  tx: ReadTX,
  indexName: IndexNames<FeedTrackerDB, "posts">,
  query: IDBKeyRange | null,
  pageSize: number,
) {
  const posts: Post[] = [];
  const store = tx.objectStore("posts");
  const index = store.index(indexName);
  let cursor = await index.openCursor(query, "prev");
  while (cursor && posts.length < pageSize) {
    const post = cursor.value;
    if (feedIds.has(post.feedId)) {
      posts.push(post);
    }
    cursor = await cursor.continue();
  }

  return posts;
}
