import { getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";

/**
 * @raises NotFoundError
 */
export async function getFeed(id: number) {
  using conn = await getDBConnection();
  try {
    const node = await conn.db.get("nodes", id);
    if (node?.type === "feed") {
      return {
        url: node.feed.url,
        name: node.name,
        frequency: node.feed.updateFrequency,
        folder: node.parentId,
      };
    } else {
      throw new Error("Feed not found.");
    }
  } catch (e) {
    console.error(e);
    const msg = "Unable to find the feed, it may have been deleted.";
    throw new NotFoundError(msg, { cause: e });
  }
}
