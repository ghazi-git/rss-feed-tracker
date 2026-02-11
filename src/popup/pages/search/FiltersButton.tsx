import { Show } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import HasFiltersIcon from "@/popup/components/svg-icons/HasFiltersIcon";
import NoFiltersIcon from "@/popup/components/svg-icons/NoFiltersIcon";

import styles from "./FiltersButton.module.css";

export default function FiltersButton(props: FiltersButtonProps) {
  return (
    <UnstyledButton class={styles.trigger} popovertarget={props.popovertarget}>
      Filters
      <Show when={props.hasFilters} fallback={<NoFiltersIcon />}>
        <HasFiltersIcon />
      </Show>
    </UnstyledButton>
  );
}

interface FiltersButtonProps {
  hasFilters: boolean;
  popovertarget: string;
}
