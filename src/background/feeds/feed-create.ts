import { Feed, getDBConnection, ReadWriteTX } from "@/background/db-setup";
import {
  getInitialFeedmetadata,
  saveSuccessMetadata,
} from "@/background/utils/feedmetadata";
import {
  fetchFeedContent,
  getPostObjects,
  parseFeedContent,
} from "@/background/utils/feeds-fetch-from-source";
import {
  getHighestSortOrder,
  updateFeedUnreadCount,
} from "@/background/utils/nodes";
import { bulkAddPosts, describeSaveResults } from "@/background/utils/posts";
import { FeedFormData } from "@/messaging-wrapper";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function loadAndCreateFeed(data: FeedFormData) {
  const feedContent = await fetchFeedContent(data.url);
  const parsedFeed = parseFeedContent(data.url, feedContent);

  const preferences = await loadPreferences();
  const markNewPostsUnread = preferences.markNewPostsUnread;
  const fetchTime = Date.now();
  const favicon = parsedFeed.favicon;
  using conn = await getDBConnection();
  const tx = conn.db.transaction(
    ["nodes", "feedmetadata", "posts"],
    "readwrite",
  );

  const feedId = await createFeed(tx, data, favicon, fetchTime);

  if (parsedFeed.posts.length) {
    // prettier-ignore
    const posts = getPostObjects(parsedFeed.posts, feedId, fetchTime, markNewPostsUnread);
    const results = await bulkAddPosts(tx, posts);
    const insertedPosts = results.filter((res) => res.success).length;
    if (insertedPosts && markNewPostsUnread) {
      await updateFeedUnreadCount(tx, feedId, insertedPosts);
    }
    const notes = describeSaveResults(results);
    await saveSuccessMetadata(
      tx,
      feedId,
      data.frequency,
      fetchTime,
      !!insertedPosts,
      notes,
    );
  } else {
    await saveSuccessMetadata(tx, feedId, data.frequency, fetchTime);
  }

  return feedId;
}

async function createFeed(
  tx: ReadWriteTX,
  data: FeedFormData,
  favicon: string | null,
  fetchTime: number,
) {
  const sortOrder = await getHighestSortOrder(tx, data.folder);
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
  } as Feed;
  const nodes = tx.objectStore("nodes");
  const feedId = await nodes.add(feed);

  const metadata = getInitialFeedmetadata(feedId);
  const feedmatadata = tx.objectStore("feedmetadata");
  await feedmatadata.add(metadata);

  return feedId;
}
