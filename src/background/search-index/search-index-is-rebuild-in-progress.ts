import { SEARCH_INDEX_REBUILDING_LOCK } from "@/utils/settings";

export async function isRebuildingSearchIndex() {
  const { held } = await navigator.locks.query();
  return (
    !!held && !!held.find((lock) => lock.name === SEARCH_INDEX_REBUILDING_LOCK)
  );
}
