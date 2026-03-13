import { useParams, useSearchParams } from "@solidjs/router";
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

export default function SearchPage() {
  const [posts, { mutate }] = createSearchResource();
  restoreScrollPositionAfterInitialFetch(posts);
  handleExitFilterShortcut();

  const [searchParams, setSearchParams] = useSearchParams<SearchPageParams>();
  const nodeId = useNodeId();
  const placeholder = () => {
    if (inBookmarksPage(nodeId())) return "Search bookmarks";

    return searchParams.nodeName
      ? `Search posts in '${searchParams.nodeName}'`
      : "Search posts";
  };
  const searchPosts = debounce(
    (query: string) => setSearchParams({ query }, { replace: true }),
    100,
  );

  return (
    <>
      <FilterPageHeader
        inputValue={searchParams.query || ""}
        onInput={(e) => {
          searchPosts(e.target.value.trim());
        }}
        isLoading={posts.loading}
        placeholder={placeholder()}
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

function createSearchResource() {
  const [searchParams] = useSearchParams<SearchPageParams>();
  const nodeId = useNodeId();

  return createResource(
    () => ({
      query: searchParams.query || "",
      nodeId: nodeId(),
      bookmarked: (inBookmarksPage(nodeId()) ? 1 : null) as 1 | null,
    }),
    async (input) => {
      const resp = await sendMessage("search-index/trigger-query", input);
      if (!resp.success) throw new Error(resp.errorMsg);

      return resp.data;
    },
  );
}

function useNodeId() {
  const params = useParams<{ id?: string }>();
  return () => (params.id ? parseInt(params.id) : null);
}

function inBookmarksPage(nodeId: number | null) {
  return nodeId === null;
}

type SearchPageParams = {
  previousUrl?: string;
  nodeName?: string;
  query?: string;
};
