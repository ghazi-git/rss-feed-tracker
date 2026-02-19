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
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { bulkAddPosts, describeSaveResults } from "@/background/utils/posts";
import {
  getAddOrUpdateOperation,
  scheduleSearchIndexing,
} from "@/background/utils/search";
import { ExtensionDB, Feed, getDBConnection, ReadWriteTX } from "@/db-setup";
import { sendMessage } from "@/messaging-wrapper";
import { loadPreferences } from "@/utils/extension-storage";
import { getAllFromIndex, txDone } from "@/utils/idb-helpers";
import { acquireLock, hasLockExpired, releaseLock } from "@/utils/locks";
import { getLogger, glogger, Logger } from "@/utils/logging";

export async function runFeedPollingAlarmHandler(scheduledAt: string) {
  const logger = getLogger({ action: "feed-polling", scheduledAt });
  logger.debug("start");
  const start = performance.now();
  using conn = await getDBConnection();

  // acquire a lock to avoid cases where feeds' loading exceeds the interval
  // between 2 consecutive alarm runs.
  const lockId = "feed-polling";
  await using disposer = new AsyncDisposableStack();
  try {
    disposer.use(await acquireLock(conn.db, lockId));
  } catch {
    // lock in use
    const expired = await hasLockExpired(conn.db, lockId);
    if (expired) {
      await releaseLock(conn.db, lockId);
      const msg = `lock=${lockId} released forcibly so it can be used in the next run`;
      logger.debug(msg);
    }
    logger.debug("aborted (cannot acquire a lock)");
    return;
  }

  logger.debug("determining due feeds...");
  const dueFeeds = await getDueFeeds(conn.db);
  if (!dueFeeds.length) {
    logger.debug("done (no feeds are due)");
    return;
  }

  logger.debug(`found ${dueFeeds.length} due feeds`);

  const newPostsCount = await loadFeeds(conn.db, dueFeeds, logger);
  if (newPostsCount) {
    await notifyOfNewPosts();
  }

  const end = performance.now();
  const took = (end - start) / 1000;
  logger.debug(`done took=${took.toFixed(3)} seconds`);
}

async function getDueFeeds(db: ExtensionDB) {
  const tx = db.transaction(["feedmetadata", "nodes"]);

  const metadata = await getAllFromIndex(tx, "feedmetadata", "by_next_run_at", {
    query: IDBKeyRange.upperBound(Date.now()),
  });
  const feedIds = new Set(metadata.map((m) => m.feedId));
  if (!feedIds.size) return [];

  const nodes = await getAllFromIndex(tx, "nodes", "by_type", {
    query: "feed",
  });
  return nodes
    .filter((n) => n.type === "feed")
    .filter((f) => feedIds.has(f.id));
}

export async function loadFeeds(
  db: ExtensionDB,
  feeds: Feed[],
  parentLogger: Logger,
) {
  const preferences = await loadPreferences();
  const markNewPostsUnread = preferences.markNewPostsUnread;

  let totalNewPosts = 0;
  // load feeds in parallel
  const chunks = getChunks(feeds, 5);
  for (const chunk of chunks) {
    const promises = chunk.map((feed) => {
      const logger = parentLogger.child({ feedId: feed.id }, true);

      return fetchAndParseFeed(feed.feed.url, logger)
        .then(async (parsedFeed) => {
          const tx = db.transaction(
            ["posts", "feedmetadata", "nodes", "searchIndexOperations"],
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
          await txDone(tx);

          return insertedPosts;
        })
        .catch(async (e) => {
          logger.error("failure", e);
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
  logger: Logger | null = null,
) {
  logger = logger ?? getLogger({ action: "save-posts" });
  if (!parsedPosts.length) {
    const frequency = node.feed.updateFrequency;
    const notes = "Feed has no posts.";
    await saveSuccessMetadata(tx, node.id, frequency, fetchTime, false, notes);
    logger.debug("done (no posts)");
    return 0;
  }

  logger.debug(`parsed ${parsedPosts.length} post(s)`);
  // prettier-ignore
  const posts = getPostObjects(parsedPosts, node.id, fetchTime, markNewPostsUnread);
  const results = await bulkAddPosts(tx, posts);
  const insertedPosts = results.filter((res) => res.success);
  logger.debug(`inserted ${insertedPosts} new post(s) in indexedDB`);
  if (insertedPosts.length && markNewPostsUnread) {
    logger.debug("updating unread counts");
    await updateFeedUnreadCount(tx, node.id, insertedPosts.length);
  }
  if (insertedPosts.length) {
    const opStore = tx.objectStore("searchIndexOperations");
    insertedPosts.forEach((res) => {
      const operation = getAddOrUpdateOperation(res.item, "add");
      opStore.add(operation);
    });
    // no 'await' to avoid the transaction being prematurely committed
    scheduleSearchIndexing();
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
  logger.debug(`done notes=${notes ?? "All parsed posts were inserted"}`);

  return insertedPosts.length;
}

async function notifyOfNewPosts() {
  try {
    await sendMessage("feed-polling/notify-of-new-posts", undefined);
  } catch (e) {
    // no listener available for the notification
    glogger.error("failed to send new posts notification", e);
  }
}
