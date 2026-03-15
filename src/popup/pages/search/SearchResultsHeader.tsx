import { useSearchParams } from "@solidjs/router";
import { Match, Show, Switch } from "solid-js";

import { SearchResult } from "@/messaging-wrapper";
import FilterErrorBoundary from "@/popup/pages/posts-filtering/FilterErrorBoundary";
import SortButton from "@/popup/pages/search/SortButton";
import {
  getNextSortOption,
  SearchPageParams,
  useSortBy,
} from "@/popup/utils/search";

import styles from "./SearchResultsHeader.module.css";

export default function SearchResultsHeader(props: SearchResultsHeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams<SearchPageParams>();
  const sortBy = useSortBy();

  return (
    <div class={styles["search-results-header"]}>
      <FilterErrorBoundary>
        <Show when={!!searchParams.query && props.posts}>
          {(results) => (
            <Switch>
              <Match when={results().length}>
                <div class={styles["search-results-text"]}>
                  Found {results().length} post
                  {results().length === 1 ? "" : "s"}
                </div>
              </Match>
              <Match when={!results().length && !props.isLoading}>
                <div class={styles["search-results-text"]}>No posts found</div>
              </Match>
            </Switch>
          )}
        </Show>
      </FilterErrorBoundary>
      <SortButton
        sortBy={sortBy()}
        onClick={() => {
          setSearchParams(
            { sortBy: getNextSortOption(sortBy()) },
            { replace: true },
          );
        }}
      />
    </div>
  );
}

interface SearchResultsHeaderProps {
  posts: SearchResult[] | undefined;
  isLoading: boolean;
}
