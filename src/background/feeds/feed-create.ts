import { unwrap } from "idb";

import { ExtensionDB, getDBConnection } from "@/background/db-setup";
import {
  describeSaveResults,
  saveFailureMetadata,
  saveSuccessMetadata,
} from "@/background/feeds/feedmetadata";
import {
  fetchFeedContent,
  parseFeedContent,
} from "@/background/feeds/feeds-fetch-from-source";
import { savePosts } from "@/background/feeds/posts-create";
import { txDone } from "@/background/utils/idb-helpers";
import { getHighestSortOrder } from "@/background/utils/nodes";
import { FeedFormData } from "@/messaging-wrapper";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function loadAndCreateFeed(data: FeedFormData) {
  const feedContent = await fetchFeedContent(data.url);
  const parsedFeed = parseFeedContent(data.url, feedContent);

  const fetchTime = Date.now();
  using conn = await getDBConnection();
  const postsCount = parsedFeed.posts.length;
  const favicon = parsedFeed.favicon;
  // prettier-ignore
  const feedId = await createFeed(conn.db, data, postsCount, favicon, fetchTime);

  if (parsedFeed.posts.length) {
    let results;
    try {
      results = await savePosts(conn.db, feedId, parsedFeed.posts, fetchTime);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown Error";
      const reason = `SavePostsError: ${errorMsg}`;
      const frequency = data.frequency;
      await saveFailureMetadata(conn.db, feedId, frequency, reason, fetchTime);
      throw e;
    }
    const hasNewPosts = results.some((res) => res.success);
    const notes = describeSaveResults(results);
    await saveSuccessMetadata(
      conn.db,
      feedId,
      data.frequency,
      fetchTime,
      hasNewPosts,
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
  postsCount: number,
  favicon: string | null,
  fetchTime: number,
) {
  const sortOrder = await getHighestSortOrder(db, data.folder);
  const preferences = await loadPreferences();
  const unreadCount = preferences.markNewPostsUnread ? postsCount : 0;
  const feed = {
    type: "feed",
    name: data.name,
    parentId: data.folder,
    unreadCount,
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
