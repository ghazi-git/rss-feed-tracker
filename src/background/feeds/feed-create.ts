import {
  Feed,
  getDBConnection,
  Post,
  ReadWriteTX,
} from "@/background/db-setup";
import {
  fetchFeedContent,
  ParsedPost,
  parseFeedContent,
} from "@/background/feeds/feeds-fetch-from-source";
import {
  getInitialFeedmetadata,
  saveSuccessMetadata,
} from "@/background/utils/feedmetadata";
import {
  getAncestors,
  getHighestSortOrder,
  getNodeMap,
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
      await updateUnreadCount(tx, feedId, insertedPosts);
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

function getPostObjects(
  parsedPosts: ParsedPost[],
  feedId: number,
  fetchTime: number,
  markNewPostsUnread: boolean,
) {
  return parsedPosts.map((post) => ({
    ...post,
    unread: markNewPostsUnread ? 1 : 0,
    bookmarked: 0,
    feedId,
    receivedAt: fetchTime,
  })) as Post[];
}

async function updateUnreadCount(
  tx: ReadWriteTX,
  feedId: number,
  newPostsCount: number,
) {
  const nodeStore = tx.objectStore("nodes");
  const nodes = await nodeStore.getAll();
  const nodeMap = getNodeMap(nodes);
  const ancestors = getAncestors(feedId, nodeMap);
  const promises = ancestors.map((a) =>
    nodeStore.put({
      ...a,
      unreadCount: a.unreadCount + newPostsCount,
    }),
  );
  await Promise.all(promises);
}
