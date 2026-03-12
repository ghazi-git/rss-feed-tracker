import { useSearchParams } from "@solidjs/router";
import { createResource, Setter, Show } from "solid-js";

import { FeedPost, sendMessage } from "@/messaging-wrapper";
import FilterErrorBoundary from "@/popup/pages/posts-filtering/FilterErrorBoundary";
import FilterPageHeader from "@/popup/pages/posts-filtering/FilterPageHeader";
import FilterResults from "@/popup/pages/posts-filtering/FilterResults";
import FilterResultsWrapper from "@/popup/pages/posts-filtering/FilterResultsWrapper";
import NoFilterResults from "@/popup/pages/posts-filtering/NoFilterResults";
import { debounce } from "@/popup/utils/debounce";
import { handleExitFilterShortcut } from "@/popup/utils/filter";
import { restoreScrollPositionAfterInitialFetch } from "@/popup/utils/last-visited-page";

export default function FilterBookmarksPage() {
  const [posts, { mutate }] = createFilterResource();
  restoreScrollPositionAfterInitialFetch(posts);
  handleExitFilterShortcut();

  const [searchParams, setSearchParams] = useSearchParams<FilterPageParams>();
  const filterPosts = debounce(
    (query: string) => setSearchParams({ query }, { replace: true }),
    200,
  );

  return (
    <>
      <FilterPageHeader
        inputValue={searchParams.query || ""}
        onInput={(e) => {
          filterPosts(e.target.value.trim());
        }}
        isLoading={posts.loading}
        placeholder="Filter recent bookmarks"
      />
      <FilterErrorBoundary>
        <Show when={posts.latest}>
          {(results) => (
            <>
              <Show when={results().length === 0}>
                <NoFilterResults />
              </Show>
              <FilterResultsWrapper
                isLoading={posts.loading}
                mutateResults={mutate as Setter<FeedPost[] | undefined>}
              >
                <FilterResults posts={results()} />
              </FilterResultsWrapper>
            </>
          )}
        </Show>
      </FilterErrorBoundary>
    </>
  );
}

function createFilterResource() {
  const [searchParams] = useSearchParams<FilterPageParams>();

  return createResource(
    () => ({ query: searchParams.query || "" }),
    async (payload) => {
      const resp = await sendMessage("posts/filter-bookmarks", payload);
      if (!resp.success) throw new Error(resp.errorMsg);

      return resp.data;
    },
  );
}

type FilterPageParams = {
  previousUrl?: string;
  query?: string;
};
