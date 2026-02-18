import { isRebuildingSearchIndex } from "@/background/search-index/search-index-is-rebuild-in-progress";
import { TriggerRebuildSearchIndex } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { getDBConnection } from "@/db-setup";
import { sendMessage } from "@/messaging-wrapper";

export async function triggerRebuildSearchIndex() {
  using conn = await getDBConnection();
  const posts = await conn.db.getAll("posts", { count: 1 });
  if (!posts.length)
    throw new TriggerRebuildSearchIndex("There are no posts to index.");

  const inProgress = await isRebuildingSearchIndex();
  if (inProgress)
    throw new TriggerRebuildSearchIndex(
      "Search index rebuilding is already in progress. Please wait until it finishes.",
    );

  await setupOffscreenDocument("Build a search index");
  // trigger the indexing but don't wait for it to finish as it can take up to
  // 90 minutes for 90K posts
  sendMessage("search-index/rebuild", undefined);
}
