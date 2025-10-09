import { ExtensionDB, getDBConnection, TreeNode } from "@/background/db-setup";
import {
  createFeedMetadata,
  describeSaveResults,
  saveFailureMetadata,
  saveSuccessMetadata,
} from "@/background/feeds/feedmetadata";
import {
  fetchFeedContent,
  parseFeedContent,
} from "@/background/feeds/feeds-fetch-from-source";
import { savePosts } from "@/background/feeds/posts-create";
import { FeedCreationError } from "@/background/utils/errors";
import { getHighestSortOrder } from "@/background/utils/nodes";
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
  let sortOrder = 10_000;
  try {
    sortOrder = await getHighestSortOrder(db, data.folder);
  } catch (e) {
    // no need for the user to know about an issue they can't fix
    // we'll go with the initial value
    console.error("feed-creation: Cannot determine the sort order", e);
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
    feedId = await db.add("nodes", feed as TreeNode);
  } catch (e) {
    console.error(e);
    const msg = "Unable to create the feed. Please try again.";
    throw new FeedCreationError(msg, { cause: e });
  }
  const createMetadata = () => createFeedMetadata(db, feedId);
  try {
    await retry(createMetadata);
  } catch (e) {
    console.error(e);
    const msg = `An unexpected error occurred during feed creation. Please \
      delete the feed and try again.`;
    throw new FeedCreationError(msg, { cause: e });
  }

  return feedId;
}
