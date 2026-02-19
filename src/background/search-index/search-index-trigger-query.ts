import { TriggerQuerySearchIndex } from "@/background/utils/errors";
import { setupOffscreenDocument } from "@/background/utils/offscreen";
import { getSearchIndexName } from "@/background/utils/search";
import { SearchQueryParams, sendMessage } from "@/messaging-wrapper";
import { loadPreferences } from "@/utils/extension-storage";

export async function triggerSearchQuery(params: SearchQueryParams) {
  await setupOffscreenDocument("Query the search index");

  const preferences = await loadPreferences();
  const timeField = preferences.orderPostsBy;
  const indexName = await getSearchIndexName();
  if (!indexName) {
    throw new TriggerQuerySearchIndex(
      "No search index found. Please go to 'Preferences' and click the 'Rebuild Search Index' button.",
    );
  }

  const response = await sendMessage("search-index/query", {
    ...params,
    timeField,
    indexName,
  });
  if (!response.success) {
    throw new TriggerQuerySearchIndex(response.errorMsg);
  }

  return response.data;
}
