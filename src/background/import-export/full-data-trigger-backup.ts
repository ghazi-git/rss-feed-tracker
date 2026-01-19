import { TriggerBackupError } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { PreferencesData, sendMessage } from "@/messaging-wrapper";

export async function triggerBackup(params: PreferencesData) {
  // "await using" not used to avoid cancelling the download triggered
  // in the offscreen doc when chrome.offscreen.closeDocument is called
  await setupOffscreenDocument();

  const response = await sendMessage("full-data/backup", params);
  if (!response.success) {
    throw new TriggerBackupError(response.errorMsg);
  }
}
