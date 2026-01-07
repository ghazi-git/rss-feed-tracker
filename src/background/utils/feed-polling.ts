import { unwrap } from "idb";

import { ExtensionDB, Feed, getDBConnection } from "@/background/db-setup";
import { getChunks } from "@/background/utils/chunks";
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
import { acquireLock } from "@/background/utils/locks";
import { COLOR_CODES, FeedPollingLogger } from "@/background/utils/logging";
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { bulkAddPosts, describeSaveResults } from "@/background/utils/posts";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function runFeedPollingAlarmHandler(scheduledAt: string) {
  FeedPollingLogger.log(scheduledAt, "start");
  const start = performance.now();
  using conn = await getDBConnection();

  // acquire a lock to avoid cases where feeds' loading exceeds the interval
  // between 2 consecutive alarm runs.
  const lockId = "feed-polling";
  await using lock = await acquireLock(conn.db, lockId);
  if (!lock.id) {
    FeedPollingLogger.log(scheduledAt, `aborted (cannot acquire a lock)`);
    return;
  }

  FeedPollingLogger.log(scheduledAt, "determining due feeds...");
  const dueFeeds = await getDueFeeds(conn.db);
  if (!dueFeeds.length) {
    FeedPollingLogger.log(scheduledAt, "done (no feeds are due)");
    return;
  }

  FeedPollingLogger.log(scheduledAt, `found ${dueFeeds.length} due feeds`);

  await loadFeeds(conn.db, dueFeeds, scheduledAt);

  const end = performance.now();
  const took = (end - start) / 1000;
  FeedPollingLogger.log(scheduledAt, `done took=${took.toFixed(3)} seconds`);
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

async function loadFeeds(db: ExtensionDB, feeds: Feed[], scheduledAt: string) {
  // load feeds in parallel
  const chunks = getChunks(feeds, 5);
  for (const chunk of chunks) {
    const promises = chunk.map((feed, idx) => {
      const colorCode = COLOR_CODES[idx % COLOR_CODES.length];
      const logger = new FeedPollingLogger(feed.id, scheduledAt, colorCode);

      return loadFeedPosts(db, feed, logger).catch(async (e) => {
        logger.error(e);
        const msg = e instanceof Error ? e.message : "Unexpected error";
        await saveFailureMetadata(db, feed, msg);
      });
    });
    await Promise.all(promises);
  }
}

async function loadFeedPosts(
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
  logger.debug(`inserted ${insertedPosts} new post(s) in indexedDB`);
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
