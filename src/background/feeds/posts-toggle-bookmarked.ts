import { NotFoundError } from "@/background/utils/errors";
import { getDBConnection } from "@/db-setup";
import { getObject, saveObject, txDone } from "@/utils/idb-helpers";

export async function toggleBookmarkedPost(
  feedId: number,
  guid: string,
  bookmarked: boolean,
) {
  using conn = await getDBConnection();

  const tx = conn.db.transaction(["posts"], "readwrite");
  const post = await getObject(tx, "posts", [feedId, guid]);
  if (!post) {
    const msg = "Unable to find the post, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  post.bookmarked = bookmarked ? 1 : 0;
  await saveObject(tx, "posts", post);

  await txDone(tx);
}
