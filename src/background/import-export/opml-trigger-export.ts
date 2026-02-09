import { OPMLTriggerExportError } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { sendMessage } from "@/messaging-wrapper";

export async function triggerOPMLExport(folder: number) {
  // "await using" not used to avoid cancelling the download triggered
  // in the offscreen doc when chrome.offscreen.closeDocument is called
  await setupOffscreenDocument("export OPML file");

  const response = await sendMessage("opml/export", { folder });
  if (!response.success) {
    throw new OPMLTriggerExportError(response.errorMsg);
  }
}
