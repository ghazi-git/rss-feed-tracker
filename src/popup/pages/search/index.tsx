import { useNavigate, useSearchParams } from "@solidjs/router";
import { Show } from "solid-js";

import { ListNavigationContextProvider } from "@/popup/pages/node/list-navigation-context";
import FilterErrorBoundary from "@/popup/pages/posts-filtering/FilterErrorBoundary";
import FilterResultsWrapper from "@/popup/pages/posts-filtering/FilterResultsWrapper";
import SearchPageHeader from "@/popup/pages/search/SearchPageHeader";
import SearchResults from "@/popup/pages/search/SearchResults";
import SearchResultsHeader from "@/popup/pages/search/SearchResultsHeader";
import { debounce } from "@/popup/utils/debounce";
import { restoreScrollPositionAfterInitialFetch } from "@/popup/utils/last-visited-page";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import {
  createSearchResource,
  inBookmarksPage,
  SearchPageParams,
  useNodeId,
  useSortBy,
} from "@/popup/utils/search";
import {
  handleExitFilterShortcut,
  handleFilterShortcut,
} from "@/popup/utils/shortcuts";
import { getSearchString } from "@/popup/utils/urls";

export default function SearchPage() {
  const [posts, { mutate }] = createSearchResource();
  const sortBy = useSortBy();
  const { preferences } = usePreferencesContext();
  const sortedPosts = () => {
    if (!posts.latest) return posts.latest;

    const feedPosts = posts.latest;
    const sortField = preferences.orderPostsBy;
    if (sortBy() === "time_desc") {
      return feedPosts.toSorted((a, b) => b[sortField] - a[sortField]);
    } else if (sortBy() === "time_asc") {
      return feedPosts.toSorted((a, b) => a[sortField] - b[sortField]);
    } else {
      return feedPosts.toSorted((a, b) => b.relevanceScore - a.relevanceScore);
    }
  };

  restoreScrollPositionAfterInitialFetch(posts);
  handleExitFilterShortcut();
  const navigate = useNavigate();
  handleFilterShortcut(() => {
    if (inBookmarksPage(nodeId())) {
      const searchString = getSearchString({
        previousUrl: "/bookmarks",
        postsView: "all",
        query: searchParams.query ?? "",
      });
      navigate(`/bookmarks/filter?${searchString}`);
    } else {
      const searchString = getSearchString({
        previousUrl: searchParams.previousUrl ?? "/library",
        nodeName: searchParams.nodeName ?? "",
        postsView: "all",
        query: searchParams.query ?? "",
      });
      navigate(`/library/nodes/${nodeId()}/filter?${searchString}`);
    }
  });

  const [searchParams, setSearchParams] = useSearchParams<SearchPageParams>();
  const nodeId = useNodeId();
  const placeholder = () => {
    if (inBookmarksPage(nodeId())) return "Search bookmarks";

    return searchParams.nodeName
      ? `Search posts in '${searchParams.nodeName}'`
      : "Search posts";
  };
  const searchPosts = debounce((query: string) => {
    if (!query) mutate([]);

    setSearchParams({ query }, { replace: true });
  }, 100);

  return (
    <>
      <SearchPageHeader
        inputValue={searchParams.query || ""}
        onInput={(e) => {
          searchPosts(e.target.value.trim());
        }}
        isLoading={posts.loading}
        placeholder={placeholder()}
      />
      <SearchResultsHeader posts={posts.latest} isLoading={posts.loading} />
      <FilterErrorBoundary>
        <Show when={sortedPosts()}>
          {(results) => (
            <ListNavigationContextProvider listLength={results().length}>
              <FilterResultsWrapper
                isLoading={posts.loading}
                mutateResults={mutate}
              >
                <SearchResults posts={results()} />
              </FilterResultsWrapper>
            </ListNavigationContextProvider>
          )}
        </Show>
      </FilterErrorBoundary>
    </>
  );
}
