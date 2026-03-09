import { useParams, useSearchParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import FilterErrorBoundary from "@/popup/pages/posts-filtering/FilterErrorBoundary";
import FilterPageHeader from "@/popup/pages/posts-filtering/FilterPageHeader";
import FilterResults from "@/popup/pages/posts-filtering/FilterResults";
import NoFilterResults from "@/popup/pages/posts-filtering/NoFilterResults";
import { debounce } from "@/popup/utils/search";

export default function PostsFilteringPage() {
  const [posts, { mutate }] = createFilterResource();

  const [searchParams, setSearchParams] = useSearchParams<FilterPageParams>();
  const placeholder = () => {
    return searchParams.nodeName
      ? `Filter recent posts in '${searchParams.nodeName}'`
      : "Filter recent posts";
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
  const params = useParams<{ id: string }>();
  const nodeId = () => parseInt(params.id);

  return createResource(
    () => ({ query: searchParams.query || "", nodeId: nodeId() }),
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
};
