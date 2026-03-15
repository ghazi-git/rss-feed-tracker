import { useParams, useSearchParams } from "@solidjs/router";
import { Accessor, createResource, onCleanup, onMount } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";

export function useSearchIndexState() {
  const [hasOperations] = createResource(
    // eslint-disable-next-line solid/reactivity
    async () => {
      const resp = await sendMessage(
        "search-index/has-unapplied-operations",
        undefined,
      );
      if (!resp.success) throw new Error(resp.errorMsg);

      return resp.data;
    },
    // default to true until we really know there are no operations to apply.
    // We want to avoid sending the user to a search page that displays
    // incomplete results
    { initialValue: true },
  );

  // eslint-disable-next-line solid/reactivity
  return () => !hasOperations.latest;
}

export function handleSearchShortcut(onShortcutTriggered?: () => void) {
  const handleShortcut = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === "F") {
      event.preventDefault();
      onShortcutTriggered?.();
    }
  };
  onMount(() => document.addEventListener("keydown", handleShortcut));
  onCleanup(() => {
    document.removeEventListener("keydown", handleShortcut);
  });
}

export function createSearchResource() {
  const [searchParams] = useSearchParams<SearchPageParams>();
  const nodeId = useNodeId();

  return createResource(
    () => {
      const bookmarked: 1 | null = inBookmarksPage(nodeId()) ? 1 : null;
      const query = searchParams.query || "";
      if (!query) return null;

      return { query, nodeId: nodeId(), bookmarked };
    },
    async (input) => {
      const resp = await sendMessage("search-index/trigger-query", input);
      if (!resp.success) throw new Error(resp.errorMsg);

      return resp.data;
    },
  );
}

export function useNodeId() {
  const params = useParams<{ id?: string }>();
  return () => (params.id ? parseInt(params.id) : null);
}

export function inBookmarksPage(nodeId: number | null) {
  return nodeId === null;
}

export function useSortBy(): Accessor<SortBy> {
  const [searchParams] = useSearchParams<SearchPageParams>();
  return () => searchParams.sortBy ?? "relevance";
}

export function getNextSortOption(currentSortBy: SortBy): SortBy {
  const idx = SORT_OPTIONS.indexOf(currentSortBy);
  return SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
}

const SORT_OPTIONS = ["relevance", "time_desc", "time_asc"] as const;
export type SortBy = (typeof SORT_OPTIONS)[number];

export type SearchPageParams = {
  previousUrl?: string;
  nodeName?: string;
  query?: string;
  sortBy?: SortBy;
};
