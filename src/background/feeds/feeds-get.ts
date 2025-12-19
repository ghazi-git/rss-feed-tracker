import { getDBConnection } from "@/background/db-setup";
import { getFolderOptionsAsTree } from "@/background/folders/folders-options";
import { NotFoundError } from "@/background/utils/errors";

/**
 * @raises NotFoundError
 */
export async function getFeed(id: number) {
  using conn = await getDBConnection();
  const [node, folderOptions] = await Promise.all([
    conn.db.get("nodes", id),
    getFolderOptionsAsTree(conn.db),
  ]);
  if (!node || node.type !== "feed") {
    console.error(`feed-get: failure to get the feed id=${id}`);
    const msg = "Unable to find the feed, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  return {
    url: node.feed.url,
    name: node.name,
    frequency: node.feed.updateFrequency,
    folder: node.parentId,
    folderOptions,
  };
}
