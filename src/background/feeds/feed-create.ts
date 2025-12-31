import { unwrap } from "idb";

import { ExtensionDB, getDBConnection, Post } from "@/background/db-setup";
import {
  describeSaveResults,
  saveFailureMetadata,
  saveSuccessMetadata,
} from "@/background/feeds/feedmetadata";
import {
  fetchFeedContent,
  ParsedPost,
  parseFeedContent,
} from "@/background/feeds/feeds-fetch-from-source";
import { bulkAdd, txDone } from "@/background/utils/idb-helpers";
import {
  getAncestors,
  getHighestSortOrder,
  getNodeMap,
} from "@/background/utils/nodes";
import { FeedFormData } from "@/messaging-wrapper";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function loadAndCreateFeed(data: FeedFormData) {
  const feedContent = await fetchFeedContent(data.url);
  const parsedFeed = parseFeedContent(data.url, feedContent);

  const fetchTime = Date.now();
  using conn = await getDBConnection();
  const favicon = parsedFeed.favicon;
  const feedId = await createFeed(conn.db, data, favicon, fetchTime);

  if (parsedFeed.posts.length) {
    const preferences = await loadPreferences();
    const markNewPostsUnread = preferences.markNewPostsUnread;
    let results;
    try {
      results = await savePosts(
        conn.db,
        feedId,
        parsedFeed.posts,
        fetchTime,
        markNewPostsUnread,
      );
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown Error";
      const reason = `SavePostsError: ${errorMsg}`;
      const frequency = data.frequency;
      await saveFailureMetadata(conn.db, feedId, frequency, reason, fetchTime);
      throw e;
    }
    const insertedPosts = results.filter((res) => res.success).length;
    if (insertedPosts && markNewPostsUnread) {
      await updateUnreadCount(conn.db, feedId, insertedPosts);
    }
    const notes = describeSaveResults(results);
    await saveSuccessMetadata(
      conn.db,
      feedId,
      data.frequency,
      fetchTime,
      !!insertedPosts,
      notes,
    );
  } else {
    await saveSuccessMetadata(conn.db, feedId, data.frequency, fetchTime);
  }

  return feedId;
}

async function createFeed(
  db: ExtensionDB,
  data: FeedFormData,
  favicon: string | null,
  fetchTime: number,
) {
  const sortOrder = await getHighestSortOrder(db, data.folder);
  const feed = {
    type: "feed",
    name: data.name,
    parentId: data.folder,
    unreadCount: 0,
    sortOrder,
    createdAt: fetchTime,
    feed: {
      favicon,
      url: data.url,
      updateFrequency: data.frequency,
    },
  };
  const tx = unwrap(db.transaction(["nodes", "feedmetadata"], "readwrite"));
  const nodes = tx.objectStore("nodes");
  const feedmatadata = tx.objectStore("feedmetadata");

  let feedId: number;
  const addRequest = nodes.add(feed);
  addRequest.onsuccess = () => {
    feedId = addRequest.result as number;
    const metadata = {
      feedId,
      nextRunAt: null,
      lastRunAt: null,
      lastRunResult: null,
      lastRunNotes: null,
      lastSuccessfulRunAt: null,
      lastUpdatedAt: null,
    };
    feedmatadata.add(metadata);
  };

  await txDone(tx);
  // @ts-expect-error feedId value is set inside onsuccess, and we're awaiting
  // transaction commit before returning the feedId
  return feedId;
}

async function savePosts(
  db: ExtensionDB,
  feedId: number,
  parsedPosts: ParsedPost[],
  fetchTime: number,
  markNewPostsUnread: boolean,
) {
  const posts: Post[] = parsedPosts.map((post) => ({
    ...post,
    unread: markNewPostsUnread ? 1 : 0,
    bookmarked: 0,
    feedId,
    receivedAt: fetchTime,
  }));
  return await bulkAdd(db, "posts", posts, 1000);
}

async function updateUnreadCount(
  db: ExtensionDB,
  feedId: number,
  newPostsCount: number,
) {
  const tx = db.transaction("nodes", "readwrite");
  const nodes = await tx.store.getAll();
  const nodeMap = getNodeMap(nodes);
  const ancestors = getAncestors(feedId, nodeMap);
  const promises = ancestors.map((a) =>
    tx.store.put({
      ...a,
      unreadCount: a.unreadCount + newPostsCount,
    }),
  );
  await Promise.all([...promises, txDone(unwrap(tx))]);
}
