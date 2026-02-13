import { useParams, useSearchParams } from "@solidjs/router";
import { createResource, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { SearchQueryParams, sendMessage } from "@/messaging-wrapper";
import InputField from "@/popup/components/forms/Input";
import SelectField from "@/popup/components/forms/Select";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import FiltersButton from "@/popup/pages/search/FiltersButton";
import FiltersPopover from "@/popup/pages/search/FiltersPopover";
import SearchResults from "@/popup/pages/search/SearchResults";
import SortButton from "@/popup/pages/search/SortButton";
import { notifyError } from "@/popup/utils/notifications";
import {
  createSortSignal,
  debounce,
  validateTimeFilters,
} from "@/popup/utils/search";

import styles from "./index.module.css";

export default function SearchPage() {
  const [searchParams] = useSearchParams<{
    previousUrl?: string;
  }>();
  const params = useParams();
  const nodeId = () => parseInt(params.id);
  const [formdata, setFormdata] = createStore<SearchQueryParams>({
    query: "",
    nodeId: nodeId(),
    bookmarked: null,
    startDate: null,
    endDate: null,
  });

  const [nodeOptions] = createNodeOptionsResource();
  const hasFilters = () => {
    const hasNodeFilter =
      nodeOptions.latest.length > 0 &&
      nodeOptions.latest[0].value !== formdata.nodeId;
    return (
      hasNodeFilter ||
      formdata.bookmarked !== null ||
      formdata.startDate !== null ||
      formdata.endDate !== null
    );
  };
  const [sort, setNextSort] = createSortSignal();
  let searchRef!: HTMLInputElement;
  onMount(() => searchRef.focus());
  const [searchInput, setSearchInput] = createSignal<SearchQueryParams | null>(
    null,
  );
  const [search, { mutate }] = createResource(
    () => {
      const input = searchInput();
      if (input === null || !input.query.trim()) return null;

      return input;
    },
    async (input) => {
      const resp = await sendMessage("search-index/trigger-query", input);
      if (!resp.success) throw new Error(resp.errorMsg);

      return resp.data;
    },
  );

  const searchPosts = () => {
    const { isValid, error } = validateTimeFilters(
      formdata.startDate,
      formdata.endDate,
    );
    if (!isValid) {
      notifyError(error, { duration: 5000 });
      return;
    }

    // ensure posts on the chosen day will be included in the search results
    const before =
      formdata.endDate !== null
        ? formdata.endDate + 24 * 60 * 60 * 1000 - 1
        : null;
    setSearchInput({ ...formdata, before });
  };
  const debouncedSearch = debounce(searchPosts, 200);

  return (
    <>
      <PageHeaderWrapper sticky={true}>
        <BackLink url={searchParams.previousUrl ?? "/library"} />
        <div class={styles.search}>
          <InputField
            ref={searchRef}
            type="text"
            name="query"
            placeholder="Search for posts"
            aria-label="Search for posts"
            dir="auto"
            value={formdata.query}
            onInput={(e) => {
              setFormdata("query", e.target.value);
              debouncedSearch();
            }}
          />
        </div>
      </PageHeaderWrapper>
      <div class={styles.filters}>
        <div class={styles.buttons}>
          <Show when={search.latest}>
            {(posts) => (
              <Show
                when={posts().length}
                fallback={
                  <div class={styles["search-results-text"]}>
                    No posts found
                  </div>
                }
              >
                <div class={styles["search-results-text"]}>
                  Found {posts().length} post{posts().length === 1 ? "" : "s"}
                </div>
              </Show>
            )}
          </Show>
          <SortButton sortBy={sort()} onClick={() => setNextSort()} />
          <FiltersButton
            hasFilters={hasFilters()}
            popovertarget="search-filters"
          />
        </div>
        <FiltersPopover id="search-filters">
          <div class={styles["filters-row"]}>
            <SelectField
              name="node"
              label="Search inside"
              options={nodeOptions.latest}
              value={formdata.nodeId}
              onChange={(e) => {
                setFormdata("nodeId", parseInt(e.target.value));
                searchPosts();
              }}
            />
            <SelectField
              name="bookmarked"
              label="Bookmarked"
              options={BOOKMARKED_OPTIONS}
              value={formdata.bookmarked ?? ""}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const v = isNaN(value) ? null : value ? 1 : 0;
                setFormdata("bookmarked", v);
                searchPosts();
              }}
            />
          </div>
          <div class={styles["filters-row"]}>
            <InputField
              type="date"
              name="startDate"
              label="Start Date"
              value={convertToDateString(formdata.startDate)}
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                setFormdata("startDate", isNaN(val) ? null : val);
                searchPosts();
              }}
            />
            <InputField
              type="date"
              name="endDate"
              label="End Date"
              value={convertToDateString(formdata.endDate)}
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                setFormdata("endDate", isNaN(val) ? null : val);
                searchPosts();
              }}
            />
          </div>
        </FiltersPopover>
      </div>
      <Show when={search.latest}>
        {(posts) => (
          <SearchResults
            posts={posts()}
            sortBy={sort()}
            mutateSearchResults={mutate}
          />
        )}
      </Show>
    </>
  );
}

function createNodeOptionsResource() {
  return createResource(
    async () => {
      const response = await sendMessage("nodes/get-options", undefined);
      if (!response.success) throw new Error(response.errorMsg);

      return response.data;
    },
    { initialValue: [] },
  );
}

function convertToDateString(timestamp: number | null) {
  if (timestamp === null) return "";

  const dt = new Date(timestamp);
  const year = `${dt.getFullYear()}`.padStart(4, "0");
  const month = `${dt.getMonth() + 1}`.padStart(2, "0");
  const day = `${dt.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const BOOKMARKED_OPTIONS = [
  { label: "Unspecified", value: "" },
  { label: "Yes", value: 1 },
  { label: "No", value: 0 },
];
