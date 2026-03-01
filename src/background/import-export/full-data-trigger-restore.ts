import {
  generateInitialRebuildingData,
  getLatestPost,
} from "@/background/search-index/search-index-trigger-rebuild";
import {
  getRootFolderUnreadCount,
  setUnreadCountOnExtensionBadge,
} from "@/background/utils/badge-unread-count";
import { TriggerRestoreError } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { saveSearchIndexRebuildingProgress } from "@/background/utils/search";
import { getDBConnection } from "@/db-setup";
import { sendMessage } from "@/messaging-wrapper";

export async function triggerRestore(fileURL: string) {
  await setupOffscreenDocument("restore data from backup");

  const response = await sendMessage("full-data/restore", { fileURL });
  if (response.success) {
    using conn = await getDBConnection();
    // now that we loaded the new backup, rebuild the search index
    const latestPost = await getLatestPost(conn.db);
    if (latestPost) {
      const params = await generateInitialRebuildingData(conn.db, latestPost);
      await saveSearchIndexRebuildingProgress(params);
    }
    // update the unread count on the extension badge
    const tx = conn.db.transaction(["nodes"]);
    const unreadCount = await getRootFolderUnreadCount(tx);
    if (unreadCount !== undefined) {
      setUnreadCountOnExtensionBadge(unreadCount);
    }
    return response.data;
  } else {
    throw new TriggerRestoreError(response.errorMsg);
  }
}
