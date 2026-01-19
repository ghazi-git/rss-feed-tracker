import { TriggerRestoreError } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { sendMessage } from "@/messaging-wrapper";

export async function triggerRestore(fileURL: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await using _ = await setupOffscreenDocument();

  const response = await sendMessage("full-data/restore", { fileURL });
  if (response.success) {
    return response.data;
  } else {
    throw new TriggerRestoreError(response.errorMsg);
  }
}
