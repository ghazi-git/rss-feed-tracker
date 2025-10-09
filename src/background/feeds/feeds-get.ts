import { Feed, getDBConnection } from "@/background/db-setup";
import { assertTypeIs } from "@/background/utils/assert-type";
import { NotFoundError } from "@/background/utils/errors";

/**
 * @raises NotFoundError
 */
export async function getFeed(id: number) {
  using conn = await getDBConnection();
  try {
    const node = await conn.db.get("nodes", id);
    assertTypeIs<Feed>(node);
    return {
      url: node.feed.url,
      name: node.name,
      frequency: node.feed.updateFrequency,
      folder: node.parentId,
    };
  } catch (e) {
    console.error("feed-get: failure to find the feed", e);
    const msg = "Unable to find the feed, it may have been deleted.";
    throw new NotFoundError(msg, { cause: e });
  }
}
