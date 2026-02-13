import { useParams, useSearchParams } from "@solidjs/router";
import { createResource, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { SearchQueryParams, sendMessage } from "@/messaging-wrapper";
import ActionButton from "@/popup/components/buttons/ActionButton";
import ButtonContainer from "@/popup/components/buttons/ButtonContainer";
import ErrorAlert from "@/popup/components/ErrorAlert";
import InputField from "@/popup/components/forms/Input";
import SelectField from "@/popup/components/forms/Select";
import PageHeader from "@/popup/components/page-header/PageHeader";
import FiltersButton from "@/popup/pages/search/FiltersButton";
import FiltersPopover from "@/popup/pages/search/FiltersPopover";
import SearchResults from "@/popup/pages/search/SearchResults";
import SortButton from "@/popup/pages/search/SortButton";
import { createSortSignal, validateSearchQuery } from "@/popup/utils/search";

import styles from "./index.module.css";

export default function SearchPage() {
  const [error, setError] = createSignal("");
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
  const [search, { mutate }] = createResource(searchInput, async (input) => {
    const resp = await sendMessage("search-index/trigger-query", input);
    if (!resp.success) throw new Error(resp.errorMsg);

    return resp.data;
  });

  return (
    <>
      <PageHeader
        text="Search"
        previousUrl={searchParams.previousUrl ?? "/library"}
      />
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const { isValid, error } = validateSearchQuery(
            formdata.query,
            formdata.startDate,
            formdata.endDate,
          );
          if (!isValid) {
            setError(error);
            return;
          }

          // ensure posts on the chosen day will be included in the search results
          const before =
            formdata.endDate !== null
              ? formdata.endDate + 24 * 60 * 60 * 1000 - 1
              : null;
          setSearchInput({ ...formdata, before });
        }}
      >
        <ErrorAlert errorMsg={error()} />
        <div class={styles.search}>
          <InputField
            ref={searchRef}
            type="text"
            name="query"
            placeholder="Search for posts"
            aria-label="Search for posts"
            dir="auto"
            value={formdata.query}
            onInput={(e) => setFormdata("query", e.target.value)}
          />
        </div>
        <div class={styles.filters}>
          <div class={styles.buttons}>
            <FiltersButton
              hasFilters={hasFilters()}
              popovertarget="search-filters"
            />
            <SortButton sortBy={sort()} onClick={() => setNextSort()} />
          </div>
          <FiltersPopover id="search-filters">
            <div class={styles["filters-row"]}>
              <SelectField
                name="node"
                label="Search inside"
                options={nodeOptions.latest}
                value={formdata.nodeId}
                onChange={(e) =>
                  setFormdata("nodeId", parseInt(e.target.value))
                }
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
                }}
              />
            </div>
            <ButtonContainer>
              <ActionButton type="submit" class={styles["apply-filters"]}>
                Apply
              </ActionButton>
            </ButtonContainer>
          </FiltersPopover>
        </div>
      </form>
      <Show when={search.latest}>
        {(posts) => (
          <SearchResults posts={posts()} mutateSearchResults={mutate} />
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
