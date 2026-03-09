import { useSearchParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import FilterErrorBoundary from "@/popup/pages/posts-filtering/FilterErrorBoundary";
import FilterPageHeader from "@/popup/pages/posts-filtering/FilterPageHeader";
import FilterResults from "@/popup/pages/posts-filtering/FilterResults";
import NoFilterResults from "@/popup/pages/posts-filtering/NoFilterResults";
import { restoreScrollPositionAfterInitialFetch } from "@/popup/utils/last-visited-page";
import { debounce } from "@/popup/utils/search";

export default function FilterBookmarksPage() {
  const [posts, { mutate }] = createFilterResource();
  restoreScrollPositionAfterInitialFetch(posts);

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
          {(posts) => (
            <>
              <Show when={posts().length === 0}>
                <NoFilterResults />
              </Show>
              <FilterResults posts={posts()} mutateFilterResults={mutate} />
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
