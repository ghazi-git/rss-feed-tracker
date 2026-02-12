import { TriggerQuerySearchIndex } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { SearchQueryParams, sendMessage } from "@/messaging-wrapper";
import { loadPreferences } from "@/utils/extension-storage";

export async function triggerSearchQuery(params: SearchQueryParams) {
  await setupOffscreenDocument("Query the search index");

  const preferences = await loadPreferences();
  const timeField = preferences.orderPostsBy;
  const response = await sendMessage("search-index/query", {
    ...params,
    timeField,
  });
  if (!response.success) {
    throw new TriggerQuerySearchIndex(response.errorMsg);
  }

  return response.data;
}
