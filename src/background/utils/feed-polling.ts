import { unwrap } from "idb";

import { ExtensionDB, Feed, getDBConnection } from "@/background/db-setup";
import {
  saveFailureMetadata,
  saveSuccessMetadata,
} from "@/background/utils/feedmetadata";
import {
  fetchFeedContent,
  getPostObjects,
  parseFeedContent,
} from "@/background/utils/feeds-fetch-from-source";
import { getAllFromIndex, txDone } from "@/background/utils/idb-helpers";
import { FeedPollingLogger } from "@/background/utils/logging";
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { bulkAddPosts, describeSaveResults } from "@/background/utils/posts";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function pollFeeds(scheduledAt: string) {
  const start = performance.now();
  using conn = await getDBConnection();

  FeedPollingLogger.log(scheduledAt, "determining due feeds...");
  const dueFeeds = await getDueFeeds(conn.db);
  if (!dueFeeds.length) {
    FeedPollingLogger.log(scheduledAt, "done (no feeds are due)");
    return;
  }

  FeedPollingLogger.log(`found ${dueFeeds.length} due feeds`);

  for (const feed of dueFeeds) {
    const logger = new FeedPollingLogger(feed.id, scheduledAt);

    try {
      await pollFeed(conn.db, feed, logger);
    } catch (e) {
      logger.error(e);
      const msg = e instanceof Error ? e.message : "Unexpected error";
      await saveFailureMetadata(conn.db, feed, msg);
    }
  }

  const end = performance.now();
  const took = (end - start) / 1000;
  FeedPollingLogger.log(`done took=${took.toFixed(3)} seconds`);
}

async function getDueFeeds(db: ExtensionDB) {
  const tx = db.transaction(["feedmetadata", "nodes"]);

  const metadata = await getAllFromIndex(tx, "feedmetadata", "by_next_run_at", {
    query: IDBKeyRange.upperBound(Date.now()),
  });
  const feedIds = metadata.map((m) => m.feedId);
  const nodes = await getAllFromIndex(tx, "nodes", "by_type", {
    query: "feed",
  });

  return nodes
    .filter((n) => n.type === "feed")
    .filter((f) => feedIds.includes(f.id));
}

async function pollFeed(
  db: ExtensionDB,
  node: Feed,
  logger: FeedPollingLogger,
) {
  logger.debug(`fetching url=${node.feed.url}`);
  const feedContent = await fetchFeedContent(node.feed.url);
  logger.debug("parsing feed...");
  const parsedFeed = parseFeedContent(node.feed.url, feedContent);

  const fetchTime = Date.now();
  if (!parsedFeed.posts.length) {
    const tx = db.transaction(["feedmetadata"], "readwrite");
    const frequency = node.feed.updateFrequency;
    const notes = "Feed has no posts.";
    await saveSuccessMetadata(tx, node.id, frequency, fetchTime, false, notes);
    await txDone(unwrap(tx));
    logger.debug("done (no posts)");
    return;
  }

  logger.debug(`parsed ${parsedFeed.posts.length} post(s)`);
  const preferences = await loadPreferences();
  const markNewPostsUnread = preferences.markNewPostsUnread;
  // prettier-ignore
  const posts = getPostObjects(parsedFeed.posts, node.id, fetchTime, markNewPostsUnread);

  const tx = db.transaction(["posts", "feedmetadata", "nodes"], "readwrite");
  const results = await bulkAddPosts(tx, posts);
  const insertedPosts = results.filter((res) => res.success).length;
  logger.debug(`inserted ${parsedFeed.posts.length} new post(s) in indexedDB`);
  if (insertedPosts && markNewPostsUnread) {
    logger.debug(`updating unread counts`);
    await updateFeedUnreadCount(tx, node.id, insertedPosts);
  }
  const notes = describeSaveResults(results);
  await saveSuccessMetadata(
    tx,
    node.id,
    node.feed.updateFrequency,
    fetchTime,
    !!insertedPosts,
    notes,
  );

  await txDone(unwrap(tx));

  logger.debug(`done notes=${notes ?? "All parsed posts were inserted"}`);
}
