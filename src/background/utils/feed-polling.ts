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
import { log, logError } from "@/background/utils/logging";
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { bulkAddPosts, describeSaveResults } from "@/background/utils/posts";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function pollFeeds() {
  using conn = await getDBConnection();

  const dueFeeds = await getDueFeeds(conn.db);
  if (!dueFeeds.length) {
    log("feed-polling: no feeds are due");
    return;
  }

  for (const feed of dueFeeds) {
    try {
      await pollFeed(conn.db, feed);
    } catch (e) {
      logError(`feed-polling: failure feedId=${feed.id}`, e);
      const msg = e instanceof Error ? e.message : "Unexpected error";
      await saveFailureMetadata(conn.db, feed, msg);
    }
  }
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

async function pollFeed(db: ExtensionDB, node: Feed) {
  const feedContent = await fetchFeedContent(node.feed.url);
  const parsedFeed = parseFeedContent(node.feed.url, feedContent);

  const fetchTime = Date.now();
  if (!parsedFeed.posts.length) {
    const tx = db.transaction(["feedmetadata"], "readwrite");
    const frequency = node.feed.updateFrequency;
    const notes = "Feed has no posts.";
    await saveSuccessMetadata(tx, node.id, frequency, fetchTime, false, notes);
    await txDone(unwrap(tx));
    return;
  }

  const preferences = await loadPreferences();
  const markNewPostsUnread = preferences.markNewPostsUnread;
  // prettier-ignore
  const posts = getPostObjects(parsedFeed.posts, node.id, fetchTime, markNewPostsUnread);

  const tx = db.transaction(["posts", "feedmetadata", "nodes"], "readwrite");
  const results = await bulkAddPosts(tx, posts);
  const insertedPosts = results.filter((res) => res.success).length;
  if (insertedPosts && markNewPostsUnread) {
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
}
