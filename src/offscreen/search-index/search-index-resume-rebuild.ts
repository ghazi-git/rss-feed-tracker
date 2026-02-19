import { getDBConnection } from "@/db-setup";
import { SearchIndexProgressParams, sendMessage } from "@/messaging-wrapper";
import {
  buildSearchIndex,
  finishRebuilding,
} from "@/offscreen/search-index/search-index-rebuild";
import { getLogger } from "@/utils/logging";
import { SEARCH_INDEX_REBUILDING_LOCK } from "@/utils/settings";

export async function resumeRebuildingSearchIndex(
  params: SearchIndexProgressParams,
) {
  const logger = getLogger({ action: "resume-rebuild-search-index" });
  logger.debug("getting lock...");
  try {
    navigator.locks.request(
      SEARCH_INDEX_REBUILDING_LOCK,
      { signal: AbortSignal.timeout(2000) },
      async () => {
        performance.mark("resume-reindexing");
        using conn = await getDBConnection();
        await buildSearchIndex(conn.db, params, logger);

        await sendMessage("search-index/finish-rebuild", {
          indexName: params.indexName,
          initialCursor: params.initialCursor,
        });
        await finishRebuilding(params.indexName, params.initialCursor);
        const res = performance.measure(
          "reindexing-duration",
          "resume-reindexing",
        );
        logger.debug("done", { duration: `${res.duration.toFixed(1)} ms` });
      },
    );
  } catch (e) {
    logger.error("failure", e);
  }
}
