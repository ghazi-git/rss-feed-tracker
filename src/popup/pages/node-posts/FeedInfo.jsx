import FeedFavicon from "@/popup/pages/node/FeedFavicon.jsx";

import styles from "./FeedInfo.module.css";

export default function FeedInfo(props) {
  return (
    <div class={styles["feed-info"]}>
      <div class={styles["feed-favicon"]}>
        <FeedFavicon favicon={props.favicon} name={props.name} />
      </div>
      <div>{props.name}</div>
    </div>
  );
}
