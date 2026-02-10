import { TriggerRebuildSearchIndex } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { sendMessage } from "@/messaging-wrapper";

export async function triggerRebuildSearchIndex() {
  await setupOffscreenDocument("Build a search index");

  const response = await sendMessage("search-index/rebuild", undefined);
  if (!response.success) {
    throw new TriggerRebuildSearchIndex(response.errorMsg);
  }
}
