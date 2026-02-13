import { createSignal } from "solid-js";

export function validateTimeFilters(
  startDate: number | null,
  endDate: number | null,
): SearchValidationResult {
  if (startDate !== null && startDate < 0) {
    return {
      isValid: false,
      error: "'Start Date' must be greater than 1970-01-01",
    };
  }
  if (endDate !== null && endDate < 0) {
    return {
      isValid: false,
      error: "'End Date' must be greater than 1970-01-01",
    };
  }
  if (startDate !== null && endDate !== null && endDate < startDate) {
    return {
      isValid: false,
      error: "'End Date' must be greater or equal to 'Start Date'",
    };
  }

  return { isValid: true, error: null };
}

export function debounce(callback: () => void, delay = 200) {
  let timer: number;

  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(callback, delay);
  };
}

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

type SearchValidationResult =
  | { isValid: true; error: null }
  | { isValid: false; error: string };
