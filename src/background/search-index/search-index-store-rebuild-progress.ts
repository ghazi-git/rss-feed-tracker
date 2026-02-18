import { saveSearchIndexRebuildingProgress } from "@/background/utils/search";
import { SearchIndexProgressParams } from "@/messaging-wrapper";

export async function storeRebuildingProgress(
  params: SearchIndexProgressParams,
) {
  await saveSearchIndexRebuildingProgress(params);
}
