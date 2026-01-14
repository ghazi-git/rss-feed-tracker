import { unwrap } from "idb";

import {
  ExtensionDB,
  Feed,
  getDBConnection,
  ReadWriteTX,
} from "@/background/db-setup";
import { getChunks } from "@/background/utils/chunks";
import {
  saveFailureMetadata,
  saveSuccessMetadata,
} from "@/background/utils/feedmetadata";
import {
  fetchAndParseFeed,
  getPostObjects,
  ParsedPost,
} from "@/background/utils/feeds-fetch-from-source";
import { getAllFromIndex, txDone } from "@/background/utils/idb-helpers";
import { acquireLock } from "@/background/utils/locks";
import {
  COLOR_CODES,
  FeedPollingLogger,
  log,
} from "@/background/utils/logging";
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

export async function loadFeeds(
  db: ExtensionDB,
  feeds: Feed[],
  scheduledAt: string,
) {
  const preferences = await loadPreferences();
  const markNewPostsUnread = preferences.markNewPostsUnread;

  let totalNewPosts = 0;
  // load feeds in parallel
  const chunks = getChunks(feeds, 5);
  for (const chunk of chunks) {
    const promises = chunk.map((feed, idx) => {
      const colorCode = COLOR_CODES[idx % COLOR_CODES.length];
      const logger = new FeedPollingLogger(feed.id, scheduledAt, colorCode);

      return fetchAndParseFeed(feed.feed.url, logger)
        .then(async (parsedFeed) => {
          const tx = db.transaction(
            ["posts", "feedmetadata", "nodes"],
            "readwrite",
          );
          const insertedPosts = await savePosts(
            tx,
            feed,
            parsedFeed.posts,
            Date.now(),
            markNewPostsUnread,
            logger,
          );
          await txDone(unwrap(tx));

          return insertedPosts;
        })
        .catch(async (e) => {
          logger.error(e);
          const msg = e instanceof Error ? e.message : "Unexpected error";
          await saveFailureMetadata(db, feed, msg);
          return 0;
        });
    });
    const newPosts = await Promise.all(promises);
    totalNewPosts += newPosts.reduce((acc, val) => acc + val, 0);
  }
  return totalNewPosts;
}

export async function savePosts(
  tx: ReadWriteTX,
  node: Feed,
  parsedPosts: ParsedPost[],
  fetchTime: number,
  markNewPostsUnread: boolean,
  logger: FeedPollingLogger | null = null,
) {
  if (!parsedPosts.length) {
    const frequency = node.feed.updateFrequency;
    const notes = "Feed has no posts.";
    await saveSuccessMetadata(tx, node.id, frequency, fetchTime, false, notes);
    log("done (no posts)", logger);
    return 0;
  }

  log(`parsed ${parsedPosts.length} post(s)`, logger);
  // prettier-ignore
  const posts = getPostObjects(parsedPosts, node.id, fetchTime, markNewPostsUnread);
  const results = await bulkAddPosts(tx, posts);
  const insertedPosts = results.filter((res) => res.success).length;
  log(`inserted ${insertedPosts} new post(s) in indexedDB`, logger);
  if (insertedPosts && markNewPostsUnread) {
    log(`updating unread counts`, logger);
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
  log(`done notes=${notes ?? "All parsed posts were inserted"}`, logger);

  return insertedPosts;
}
