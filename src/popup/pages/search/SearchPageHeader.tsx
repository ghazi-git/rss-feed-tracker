import { useSearchParams } from "@solidjs/router";
import { JSX, Match, onMount, Switch } from "solid-js";

import { Input } from "@/popup/components/forms/Input";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import InfoIcon from "@/popup/components/svg-icons/InfoIcon";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";
import {
  handleSearchShortcut,
  useSearchIndexState,
} from "@/popup/utils/search";

import styles from "./SearchPageHeader.module.css";

export default function SearchPageHeader(props: SearchPageHeaderProps) {
  const [searchParams] = useSearchParams<{ previousUrl?: string }>();
  let searchRef!: HTMLInputElement;
  onMount(() => searchRef.focus());
  handleSearchShortcut(() => searchRef.focus());
  const isSearchIndexReady = useSearchIndexState();

  return (
    <PageHeaderWrapper sticky={true}>
      <BackLink url={searchParams.previousUrl ?? "/library"} />
      <div class={styles.search}>
        <Input
          ref={searchRef}
          type="text"
          name="query"
          placeholder={props.placeholder}
          aria-label={props.placeholder}
          dir="auto"
          value={props.inputValue}
          onInput={(e) => {
            props.onInput(e);
          }}
        />
        <Switch>
          <Match when={props.isLoading}>
            <LoadingIcon class={styles.icon} />
          </Match>
          <Match when={!props.isLoading && !isSearchIndexReady()}>
            <div
              class={styles.icon}
              title={
                "The search index is not completely up-to-date, so search results might not be accurate.\n" +
                "Since indexing can be resource-heavy depending on the number of posts stored, it will \n" +
                "run only after the extension popup is closed."
              }
            >
              <InfoIcon />
            </div>
          </Match>
        </Switch>
      </div>
    </PageHeaderWrapper>
  );
}

interface SearchPageHeaderProps {
  inputValue: string;
  onInput: JSX.InputEventHandler<HTMLInputElement, InputEvent>;
  isLoading: boolean;
  placeholder: string;
}
