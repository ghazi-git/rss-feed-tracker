import { OPMLTriggerExportError } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { getDBConnection } from "@/db-setup";
import { sendMessage } from "@/messaging-wrapper";

export async function triggerRootExport() {
  using conn = await getDBConnection();
  const folders = await conn.db.getAllFromIndex("nodes", "by_type", "folder");
  const root = folders.find((f) => !f.parentId);
  if (!root) {
    throw new OPMLTriggerExportError("There are no feeds to export.");
  }

  // "await using" not used to avoid cancelling the download triggered
  // in the offscreen doc when chrome.offscreen.closeDocument is called
  await setupOffscreenDocument("export OPML file");

  const response = await sendMessage("opml/export", { folder: root.id });
  if (!response.success) {
    throw new OPMLTriggerExportError(response.errorMsg);
  }
}
