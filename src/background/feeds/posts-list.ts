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
      orderBy === "fetchedAt"
        ? "by_unread_feed_id_fetched_at_guid"
        : "by_unread_feed_id_published_at_guid",
      query,
      pageSize,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.bound([1, feedId], [1, feedId + 1], false, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_unread_feed_id_fetched_at_guid"
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
      orderBy === "fetchedAt"
        ? "by_feed_id_fetched_at_guid"
        : "by_feed_id_published_at_guid",
      query,
      pageSize,
    );
  } else {
    const query = IDBKeyRange.bound([feedId], [feedId + 1], false, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_feed_id_fetched_at_guid"
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
      orderBy === "fetchedAt"
        ? "by_unread_fetched_at_feed_id_guid"
        : "by_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (postsView === "unread") {
    const query = IDBKeyRange.lowerBound([1]);
    return await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_unread_fetched_at_feed_id_guid"
        : "by_unread_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else if (cursor) {
    const upper = [cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.upperBound(upper, true);
    return await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_fetched_at_feed_id_guid"
        : "by_published_at_feed_id_guid",
      query,
      pageSize,
    );
  } else {
    return await getPostsFromIndex(
      tx,
      orderBy === "fetchedAt"
        ? "by_fetched_at_feed_id_guid"
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
    const upper: UnreadIndexKey = [1, cursor.time, cursor.feedId, cursor.guid];
    return await getUnreadPostsInFolder(tx, feedIds, upper, orderBy, pageSize);
  } else if (postsView === "unread") {
    return await getUnreadPostsInFolder(tx, feedIds, null, orderBy, pageSize);
  } else if (cursor) {
    const upper = [cursor.time, cursor.feedId, cursor.guid];
    const query = IDBKeyRange.upperBound(upper, true);
    return await getAllPostsInFolder(tx, feedIds, query, orderBy, pageSize);
  } else {
    return await getAllPostsInFolder(tx, feedIds, null, orderBy, pageSize);
  }
}

async function getUnreadPostsInFolder(
  tx: ReadTX,
  feedIds: Set<number>,
  initialUpperBound: UnreadIndexKey | null,
  orderBy: OrderPostsBy,
  pageSize: number,
) {
  // getting 1k batches of posts, then filtering is ~1.5 times faster than
  // using openCursor
  const posts: Post[] = [];
  const batchSize = 1000;
  const idx =
    orderBy === "fetchedAt"
      ? "by_unread_fetched_at_feed_id_guid"
      : "by_unread_published_at_feed_id_guid";
  let upper: UnreadIndexKey | null = initialUpperBound;
  while (true) {
    const query = upper
      ? IDBKeyRange.bound([1], upper, false, true)
      : IDBKeyRange.lowerBound([1]);
    const postsBatch = await getPostsFromIndex(tx, idx, query, batchSize);
    if (postsBatch.length === 0) break;

    posts.push(...postsBatch.filter((p) => feedIds.has(p.feedId)));

    if (posts.length >= pageSize || postsBatch.length < batchSize) break;

    const last = postsBatch[postsBatch.length - 1];
    const time = orderBy === "fetchedAt" ? last.fetchedAt : last.publishedAt;
    upper = [1, time, last.feedId, last.guid];
  }

  return posts.slice(0, pageSize);
}

async function getAllPostsInFolder(
  tx: ReadTX,
  feedIds: Set<number>,
  initialCursor: IDBKeyRange | null,
  orderBy: OrderPostsBy,
  pageSize: number,
) {
  // getting 1k batches of posts, then filtering is 1.5~2 times faster than
  // using openCursor
  const posts: Post[] = [];
  const batchSize = 1000;
  const idx =
    orderBy === "fetchedAt"
      ? "by_fetched_at_feed_id_guid"
      : "by_published_at_feed_id_guid";
  let cursor: IDBKeyRange | null = initialCursor;
  while (true) {
    const postsBatch = await getPostsFromIndex(tx, idx, cursor, batchSize);
    if (postsBatch.length === 0) break;

    posts.push(...postsBatch.filter((p) => feedIds.has(p.feedId)));

    if (posts.length >= pageSize || postsBatch.length < batchSize) break;

    const last = postsBatch[postsBatch.length - 1];
    const time = orderBy === "fetchedAt" ? last.fetchedAt : last.publishedAt;
    cursor = IDBKeyRange.upperBound([time, last.feedId, last.guid], true);
  }

  return posts.slice(0, pageSize);
}

type UnreadIndexKey =
  | FeedTrackerDB["posts"]["indexes"]["by_unread_fetched_at_feed_id_guid"]
  | FeedTrackerDB["posts"]["indexes"]["by_unread_published_at_feed_id_guid"];
