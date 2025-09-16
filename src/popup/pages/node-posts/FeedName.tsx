import { singleLineEllipsis } from "@/popup/directives/ellipsis";

import styles from "./FeedName.module.css";

export default function FeedName(props: { name: string }) {
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
