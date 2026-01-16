import { NotFoundError } from "@/background/utils/errors";
import { update } from "@/background/utils/idb-helpers";
import { getDBConnection } from "@/db-setup";

export async function toggleBookmarkedPost(
  feedId: number,
  guid: string,
  bookmarked: boolean,
) {
  using conn = await getDBConnection();

  try {
    await update(conn.db, "posts", [feedId, guid], {
      bookmarked: bookmarked ? 1 : 0,
    });
  } catch (e) {
    if (e instanceof NotFoundError) {
      const msg = "Unable to find the post, it may have been deleted.";
      throw new NotFoundError(msg);
    } else {
      throw e;
    }
  }
}
