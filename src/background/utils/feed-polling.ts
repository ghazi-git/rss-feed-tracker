import {
  fetchAndParseFeed,
  getPostObjects,
  ParsedPost,
} from "@/background/utils/feeds-fetch-from-source";
import {
  updateFeedRunTimes,
  updateFeedUnreadCount,
} from "@/background/utils/nodes";
import { bulkAddPosts, describeSaveResults } from "@/background/utils/posts";
import {
  getAddOrUpdateOperation,
  scheduleSearchIndexing,
} from "@/background/utils/search";
import { ExtensionDB, Feed, getDBConnection, ReadWriteTX } from "@/db-setup";
import { sendMessage } from "@/messaging-wrapper";
import { getChunks } from "@/utils/chunks";
import { txDone } from "@/utils/idb-helpers";
import { getLogger, glogger, Logger } from "@/utils/logging";

export async function runFeedPollingAlarmHandler(logger: Logger) {
  performance.mark("polling_start");
  using conn = await getDBConnection();

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

  const res = performance.measure("polling_duration", "polling_start");
  logger.debug("done", { pollingDuration: `${res.duration.toFixed(1)} ms` });
}

async function getDueFeeds(db: ExtensionDB) {
  const nodes = await db.getAllFromIndex("nodes", "by_next_run_at", {
    query: IDBKeyRange.upperBound(Date.now()),
  });
  return nodes.filter((n) => n.type === "feed");
}

export async function loadFeeds(
  db: ExtensionDB,
  feeds: Feed[],
  parentLogger: Logger,
) {
  let totalNewPosts = 0;
  // load feeds in parallel
  const chunks = getChunks(feeds, 5);
  for (const chunk of chunks) {
    const promises = chunk.map((feed) => {
      const logger = parentLogger.child({ feedId: feed.id }, true);

      return fetchAndParseFeed(feed.feed.url, logger)
        .then(async (parsedFeed) => {
          const tx = db.transaction(
            ["posts", "nodes", "searchIndexOperations"],
            "readwrite",
          );
          const insertedPosts = await savePosts(
            tx,
            feed,
            parsedFeed.posts,
            Date.now(),
            logger,
          );
          await txDone(tx);

          return insertedPosts;
        })
        .catch(async (e) => {
          logger.error("failure", e);
          const tx = db.transaction(["nodes"], "readwrite");
          await updateFeedRunTimes(tx, feed, Date.now());
          await txDone(tx);
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
  logger: Logger | null = null,
) {
  logger = logger ?? getLogger({ action: "save-posts" });
  if (!parsedPosts.length) {
    await updateFeedRunTimes(tx, node, fetchTime);
    logger.debug("done (no posts)");
    return 0;
  }

  logger.debug(`parsed ${parsedPosts.length} post(s)`);
  // prettier-ignore
  const posts = getPostObjects(parsedPosts, node.id, fetchTime);
  const results = await bulkAddPosts(tx, posts);
  const insertedPosts = results.filter((res) => res.success);
  logger.debug(`inserted ${insertedPosts.length} new post(s) in indexedDB`);
  await updateFeedRunTimes(tx, node, fetchTime);
  if (insertedPosts.length) {
    logger.debug("updating unread counts");
    await updateFeedUnreadCount(tx, node.id, insertedPosts.length);
    // schedule indexing of the new posts
    const opStore = tx.objectStore("searchIndexOperations");
    insertedPosts.forEach((res) => {
      const operation = getAddOrUpdateOperation(res.item, "add");
      opStore.add(operation);
    });
    // no 'await' to avoid the transaction being prematurely committed
    scheduleSearchIndexing();
  }
  const notes = describeSaveResults(results);
  logger.debug(`done notes=${notes}`);

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
