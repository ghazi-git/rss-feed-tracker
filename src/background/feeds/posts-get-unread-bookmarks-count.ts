import { getDBConnection } from "@/db-setup";

export async function getUnreadBookmarksCount() {
  using conn = await getDBConnection();

  return await conn.db.countFromIndex(
    "posts",
    "by_bookmarked_unread_published_at_feed_id_guid",
    IDBKeyRange.lowerBound([1, 1]),
  );
}
