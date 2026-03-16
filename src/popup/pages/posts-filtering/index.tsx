import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import FilterErrorBoundary from "@/popup/pages/posts-filtering/FilterErrorBoundary";
import FilterPageHeader from "@/popup/pages/posts-filtering/FilterPageHeader";
import FilterResults from "@/popup/pages/posts-filtering/FilterResults";
import FilterResultsWrapper from "@/popup/pages/posts-filtering/FilterResultsWrapper";
import NoFilterResults from "@/popup/pages/posts-filtering/NoFilterResults";
import { debounce } from "@/popup/utils/debounce";
import { restoreScrollPositionAfterInitialFetch } from "@/popup/utils/last-visited-page";
import { useNodeId } from "@/popup/utils/search";
import {
  handleExitFilterShortcut,
  handleSearchShortcut,
} from "@/popup/utils/shortcuts";
import { getSearchString } from "@/popup/utils/urls";

export default function PostsFilteringPage() {
  const [posts, { mutate }] = createFilterResource();
  restoreScrollPositionAfterInitialFetch(posts);
  handleExitFilterShortcut();
  const navigate = useNavigate();
  const nodeId = useNodeId();
  handleSearchShortcut(() => {
    const searchString = getSearchString({
      previousUrl: searchParams.previousUrl ?? "/library",
      nodeName: searchParams.nodeName ?? "",
      query: searchParams.query ?? "",
    });
    navigate(`/library/nodes/${nodeId()}/search?${searchString}`);
  });

  const [searchParams, setSearchParams] = useSearchParams<FilterPageParams>();
  const placeholder = () => {
    const postsType = searchParams.postsView === "unread" ? "unread " : "";
    return searchParams.nodeName
      ? `Filter recent ${postsType}posts in '${searchParams.nodeName}'`
      : `Filter recent ${postsType}posts`;
  };
  const filterPosts = debounce(
    (query: string) => setSearchParams({ query }, { replace: true }),
    100,
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
        <Show when={posts.latest}>
          {(results) => (
            <>
              <Show when={results().length === 0}>
                <NoFilterResults />
              </Show>
              <FilterResultsWrapper
                isLoading={posts.loading}
                mutateResults={mutate}
              >
                <FilterResults
                  posts={results()}
                  query={searchParams.query || ""}
                />
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
  const params = useParams<{ id: string }>();
  const nodeId = () => parseInt(params.id);

  return createResource(
    () => ({
      query: searchParams.query || "",
      nodeId: nodeId(),
      postsView: searchParams.postsView ?? "all",
    }),
    async (payload) => {
      const resp = await sendMessage("posts/filter", payload);
      if (!resp.success) throw new Error(resp.errorMsg);

      return resp.data;
    },
  );
}

type FilterPageParams = {
  previousUrl?: string;
  nodeName?: string;
  query?: string;
  postsView?: PostsView;
};
