import { JSX, Match, Switch } from "solid-js";

import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import ArrowIcon from "@/popup/components/svg-icons/ArrowIcon";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { SortBy } from "@/popup/utils/search";

import styles from "./SortButton.module.css";

export default function SortButton(props: SortButtonProps) {
  const { preferences } = usePreferencesContext();
  const timeField = () =>
    preferences.orderPostsBy === "fetchedAt" ? "Fetched" : "Published";

  return (
    <UnstyledButton class={styles.sort} onClick={(e) => props.onClick(e)}>
      Sort by:
      <Switch>
        <Match when={props.sortBy === "relevance"}>
          <span>Relevance</span>
        </Match>
        <Match when={props.sortBy === "time_desc"}>
          <span>{timeField()}</span>
          <ArrowIcon />
        </Match>
        <Match when={props.sortBy === "time_asc"}>
          <span>{timeField()}</span>
          <ArrowIcon orientation="up" />
        </Match>
      </Switch>
    </UnstyledButton>
  );
}

interface SortButtonProps {
  sortBy: SortBy;
  onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}
