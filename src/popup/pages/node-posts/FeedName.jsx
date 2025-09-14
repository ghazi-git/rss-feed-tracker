import { singleLineEllipsis } from "@/popup/directives/ellipsis.js";

import styles from "./FeedName.module.css";

export default function FeedName(props) {
  return (
    <div
      class={styles["feed-name"]}
      dir="auto"
      use:singleLineEllipsis={props.name}
    >
      {props.name}
    </div>
  );
}
