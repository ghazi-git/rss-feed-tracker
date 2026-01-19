import { retry } from "@/background/utils/retry-on-error";
import { getDBConnection } from "@/db-setup";
import { PreferencesData } from "@/messaging-wrapper";
import { RestoreError } from "@/offscreen/errors";
import { acquireLock, hasLockExpired, releaseLock } from "@/utils/locks";

export async function restoreExtension(
  fileURL: string,
): Promise<PreferencesData> {
  using conn = await getDBConnection();
  // prevent the background fetch from attempting to insert data while
  // the restore is in progress
  const lockId = "feed-polling";
  const getLock = async () => acquireLock(conn.db, lockId);
  await using disposer = new AsyncDisposableStack();
  try {
    disposer.use(await retry(getLock));
  } catch {
    // lock in use
    const expired = await hasLockExpired(conn.db, lockId);
    if (expired) {
      await releaseLock(conn.db, lockId);
    }
    throw new RestoreError(
      "The feeds are being updated in the background, please try again once that is done.",
    );
  }

  console.log("fileURL", fileURL);
  return {
    uiTheme: "dark",
    clickPostToToggleUnread: true,
    markNewPostsUnread: true,
    defaultFeedUpdateFrequency: 2 * 3600 * 1000,
  };
}
