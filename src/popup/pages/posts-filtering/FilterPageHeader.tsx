import { useSearchParams } from "@solidjs/router";
import { JSX, onMount, Show } from "solid-js";

import { Input } from "@/popup/components/forms/Input";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";
import { handleFilterShortcut } from "@/popup/utils/filter";

import styles from "./FilterPageHeader.module.css";

export default function FilterPageHeader(props: FilterPageHeaderProps) {
  const [searchParams] = useSearchParams<{ previousUrl?: string }>();
  let filterRef!: HTMLInputElement;
  onMount(() => filterRef.focus());
  handleFilterShortcut(() => filterRef.focus());

  return (
    <PageHeaderWrapper sticky={true}>
      <BackLink url={searchParams.previousUrl ?? "/library"} />
      <div class={styles.filter}>
        <Input
          ref={filterRef}
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
        <Show when={props.isLoading}>
          <LoadingIcon class={styles.icon} />
        </Show>
      </div>
    </PageHeaderWrapper>
  );
}

interface FilterPageHeaderProps {
  inputValue: string;
  onInput: JSX.InputEventHandler<HTMLInputElement, InputEvent>;
  isLoading: boolean;
  placeholder: string;
}
