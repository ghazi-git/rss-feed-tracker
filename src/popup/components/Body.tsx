import { FlowProps } from "solid-js";

import {
  saveLastVisitedPage,
  useCurrentURL,
} from "@/popup/utils/last-visited-page";

import styles from "./Body.module.css";

export default function Body(props: FlowProps) {
  const currentURL = useCurrentURL();

  return (
    <div
      id="page-body"
      class={styles.body}
      onScrollEnd={(event) => {
        saveLastVisitedPage(currentURL(), event.target.scrollTop);
      }}
    >
      {props.children}
    </div>
  );
}
