import { ExtensionDB, Node, setupDB } from "@/background/db-setup";
import { fetchFeedContent, parseFeedContent } from "@/background/feeds/fetch";
import { FeedCreationError } from "@/background/utils/errors";
import { retry } from "@/background/utils/retry-on-error";
import { FeedAddPayload } from "@/messaging-wrapper";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function loadAndCreateFeed(data: FeedAddPayload) {
  const feedContent = await fetchFeedContent(data.url);
  const parsedFeed = parseFeedContent(data.url, feedContent);
  const feedId = await createFeed(
    data,
    parsedFeed.posts.length,
    parsedFeed.favicon,
  );
  if (parsedFeed.posts.length) {
    // todo save posts
  }

  return feedId;
}

async function createFeed(
  data: FeedAddPayload,
  postsCount: number,
  favicon: string | null,
) {
  const db = await setupDB();
  let sortOrder;
  try {
    sortOrder = await getHighestSortOrder(db, data.folder);
  } catch {
    const msg =
      "Unable to determine the sort order of the feed. Please try again.";
    throw new FeedCreationError(msg);
  }

  const timeNow = Date.now();
  const preferences = await loadPreferences();
  const unreadCount = preferences.markNewPostsUnread ? postsCount : 0;
  const feed = {
    type: "feed",
    name: data.name,
    parentId: data.folder,
    unreadCount,
    sortOrder,
    createdAt: timeNow,
    feed: {
      favicon,
      url: data.url,
      updateFrequency: data.frequency,
    },
  };
  let feedId;
  try {
    feedId = await db.add("nodes", feed as Node);
  } catch {
    const msg = "Unable to create the feed. Please try again.";
    throw new FeedCreationError(msg);
  }

  const createFeedMetadata = async () => {
    await db.add("feedmetadata", {
      feedId,
      nextRunAt: timeNow + data.frequency,
      lastRunAt: timeNow,
      lastRunResult: "success",
      lastRunNotes: null,
      lastSuccessfulRunAt: timeNow,
      lastUpdatedAt: postsCount ? timeNow : null,
    });
  };
  try {
    await retry(createFeedMetadata);
  } catch {
    const msg = `An unexpected error occurred during feed creation. Please \
      delete the feed and try again.`;
    throw new FeedCreationError(msg);
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
  const sortOrder = children?.[0].sortOrder ?? 0;
  return sortOrder + 10_000;
}
