import { getFolderOptionsAsTree } from "@/background/folders/folders-options";
import { NotFoundError } from "@/background/utils/errors";
import { getDBConnection } from "@/db-setup";

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
    const msg = "Unable to find the feed, it may have been deleted.";
    throw new NotFoundError(msg, { cause: `feed not found id=${id}` });
  }

  return {
    url: node.feed.url,
    name: node.name,
    frequency: node.feed.updateFrequency,
    folder: node.parentId,
    iconURL: node.feed.favicon ?? "",
    folderOptions,
  };
}
