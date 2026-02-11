import { createSignal } from "solid-js";

export function createSortSignal() {
  const [sort, setSort] = createSignal<SortBy>(SORT_OPTIONS[0]);

  const setNextSortOption = () => {
    setSort((prev) => {
      const idx = SORT_OPTIONS.indexOf(prev);
      return SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
    });
  };
  return [sort, setNextSortOption] as const;
}

const SORT_OPTIONS = ["relevance", "time_desc", "time_asc"] as const;

export type SortBy = (typeof SORT_OPTIONS)[number];
