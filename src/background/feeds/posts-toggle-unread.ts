import { getDBConnection } from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";
import { update } from "@/background/utils/idb-helpers";

export async function toggleUnreadPost(
  feedId: number,
  guid: string,
  unread: boolean,
) {
  using conn = await getDBConnection();

  try {
    await update(conn.db, "posts", [feedId, guid], { unread: unread ? 1 : 0 });
  } catch (e) {
    if (e instanceof NotFoundError) {
      const msg = "Unable to find the post, it may have been deleted.";
      throw new NotFoundError(msg);
    } else {
      throw e;
    }
  }
}
