import { savePosts } from "@/background/utils/feed-polling";
import { fetchAndParseFeed } from "@/background/utils/feeds-fetch-from-source";
import { createFeed } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { FeedFormData } from "@/messaging-wrapper";
import { txDone } from "@/utils/idb-helpers";

export async function loadAndCreateFeed(data: FeedFormData) {
  const parsedFeed = await fetchAndParseFeed(data.url);

  const fetchTime = Date.now();
  const favicon = parsedFeed.favicon;
  using conn = await getDBConnection();
  const tx = conn.db.transaction(
    ["nodes", "posts", "searchIndexOperations"],
    "readwrite",
  );

  const feed = await createFeed(tx, data, favicon, fetchTime);

  await savePosts(tx, feed, parsedFeed.posts, fetchTime);

  await txDone(tx);

  return feed.id;
}
