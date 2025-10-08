import { ExtensionDB, getDBConnection, Node } from "@/background/db-setup";
import {
  describeSaveResults,
  saveFailureMetadata,
  saveSuccessMetadata,
} from "@/background/feeds/feedmetadata";
import {
  fetchFeedContent,
  parseFeedContent,
} from "@/background/feeds/fetch-from-source";
import { savePosts } from "@/background/feeds/posts-create";
import { FeedCreationError } from "@/background/utils/errors";
import { retry } from "@/background/utils/retry-on-error";
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
  let sortOrder;
  try {
    sortOrder = await getHighestSortOrder(db, data.folder);
  } catch (e) {
    console.error(e);
    const msg =
      "Unable to determine the sort order of the feed. Please try again.";
    throw new FeedCreationError(msg);
  }

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
  let feedId;
  try {
    feedId = await db.add("nodes", feed as Node);
  } catch (e) {
    console.error(e);
    const msg = "Unable to create the feed. Please try again.";
    throw new FeedCreationError(msg, { cause: e });
  }

  const createFeedMetadata = async () => {
    await db.add("feedmetadata", {
      feedId,
      nextRunAt: null,
      lastRunAt: null,
      lastRunResult: null,
      lastRunNotes: null,
      lastSuccessfulRunAt: null,
      lastUpdatedAt: null,
    });
  };
  try {
    await retry(createFeedMetadata);
  } catch (e) {
    console.error(e);
    const msg = `An unexpected error occurred during feed creation. Please \
      delete the feed and try again.`;
    throw new FeedCreationError(msg, { cause: e });
  }

  return feedId;
}

async function getHighestSortOrder(db: ExtensionDB, folder: number) {
  const children = await db.getAllFromIndex(
    "nodes",
    "by_parent_id_sort_order",
    {
      query: IDBKeyRange.bound([folder, 0], [folder, Infinity]),
      count: 1,
      direction: "prev",
    },
  );
  const sortOrder = children[0]?.sortOrder ?? 0;
  return sortOrder + 10_000;
}
