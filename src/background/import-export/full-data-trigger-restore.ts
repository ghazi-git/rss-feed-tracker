import {
  getRootFolderUnreadCount,
  setUnreadCountOnExtensionBadge,
} from "@/background/utils/badge-unread-count";
import { TriggerRestoreError } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { getDBConnection } from "@/db-setup";
import { sendMessage } from "@/messaging-wrapper";

export async function triggerRestore(fileURL: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await using _ = await setupOffscreenDocument("restore data from backup");

  const response = await sendMessage("full-data/restore", { fileURL });
  if (response.success) {
    // update the unread count on the extension badge
    using conn = await getDBConnection();
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
