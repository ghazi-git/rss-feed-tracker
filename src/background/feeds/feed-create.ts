import { unwrap } from "idb";

import { getDBConnection } from "@/background/db-setup";
import { savePosts } from "@/background/utils/feed-polling";
import { fetchAndParseFeed } from "@/background/utils/feeds-fetch-from-source";
import { txDone } from "@/background/utils/idb-helpers";
import { createFeed } from "@/background/utils/nodes";
import { FeedFormData } from "@/messaging-wrapper";
import { loadPreferences } from "@/popup/utils/preferences-storage";

export async function loadAndCreateFeed(data: FeedFormData) {
  const parsedFeed = await fetchAndParseFeed(data.url);

  const preferences = await loadPreferences();
  const markNewPostsUnread = preferences.markNewPostsUnread;
  const fetchTime = Date.now();
  const favicon = parsedFeed.favicon;
  using conn = await getDBConnection();
  const tx = conn.db.transaction(
    ["nodes", "feedmetadata", "posts"],
    "readwrite",
  );

  const feed = await createFeed(tx, data, favicon, fetchTime);

  await savePosts(tx, feed, parsedFeed.posts, fetchTime, markNewPostsUnread);

  await txDone(unwrap(tx));

  return feed.id;
}
