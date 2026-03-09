export const PAGE_SIZE = 50;
export const ICONS_CACHE = "image-cache-v1";
export const SORT_ORDER_STEP = 10_000;
export const RECENT_POSTS_LIMIT = 1000;
// set the SEARCH_RESULTS_LIMIT the same as PAGE_SIZE. That way, when moving
// from the folder posts page to the filtering page while "group posts by feed"
// is enabled, the posts displayed remain the same in the same order
export const SEARCH_RESULTS_LIMIT = PAGE_SIZE;
export const SEARCH_INDEX_DEFAULT_STORE = "search-index";
export const SEARCH_INDEX_REBUILDING_LOCK = "search-index-rebuilding";
export const SEARCH_INDEX_REBUILDING_ALARM = "search-index-rebuilding";
export const SEARCH_INDEXING_ALARM = "search-indexing";
export const SEARCH_INDEXING_LOCK = "search-indexing";
export const FEED_POLLING_LOCK = "feed-polling";
export const POPUP_STATE_PORT = "popup-state-monitor";
