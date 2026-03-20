import { useNavigate, useSearchParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import { ListNavigationContextProvider } from "@/popup/pages/node/list-navigation-context";
import FilterErrorBoundary from "@/popup/pages/posts-filtering/FilterErrorBoundary";
import FilterPageHeader from "@/popup/pages/posts-filtering/FilterPageHeader";
import FilterResults from "@/popup/pages/posts-filtering/FilterResults";
import FilterResultsWrapper from "@/popup/pages/posts-filtering/FilterResultsWrapper";
import NoFilterResults from "@/popup/pages/posts-filtering/NoFilterResults";
import { debounce } from "@/popup/utils/debounce";
import { useGroupedFilterResults } from "@/popup/utils/filter";
import { getListItemsFromPosts } from "@/popup/utils/keyboard-nav";
import { restoreScrollPositionAfterInitialFetch } from "@/popup/utils/last-visited-page";
import {
  handleExitFilterShortcut,
  handleSearchShortcut,
} from "@/popup/utils/shortcuts";
import { getSearchString } from "@/popup/utils/urls";

export default function FilterBookmarksPage() {
  const [posts, { mutate }] = createFilterResource();
  const groupedPosts = useGroupedFilterResults(posts);

  restoreScrollPositionAfterInitialFetch(posts);
  handleExitFilterShortcut();
  const navigate = useNavigate();
  handleSearchShortcut(() => {
    const searchString = getSearchString({
      previousUrl: "/bookmarks",
      query: searchParams.query ?? "",
    });
    navigate(`/bookmarks/search?${searchString}`);
  });

  const [searchParams, setSearchParams] = useSearchParams<FilterPageParams>();
  const placeholder = () => {
    const postsType = searchParams.postsView === "unread" ? "unread " : "";
    return `Filter recent ${postsType}bookmarks`;
  };
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
        placeholder={placeholder()}
      />
      <FilterErrorBoundary>
        <Show when={groupedPosts()}>
          {(results) => (
            <ListNavigationContextProvider
              items={getListItemsFromPosts(results())}
            >
              <Show when={results().length === 0}>
                <NoFilterResults />
              </Show>
              <FilterResultsWrapper
                isLoading={posts.loading}
                mutateResults={mutate}
              >
                <FilterResults posts={results()} />
              </FilterResultsWrapper>
            </ListNavigationContextProvider>
          )}
        </Show>
      </FilterErrorBoundary>
    </>
  );
}

function createFilterResource() {
  const [searchParams] = useSearchParams<FilterPageParams>();

  return createResource(
    () => ({
      query: searchParams.query || "",
      postsView: searchParams.postsView ?? "all",
    }),
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
  postsView?: PostsView;
};
