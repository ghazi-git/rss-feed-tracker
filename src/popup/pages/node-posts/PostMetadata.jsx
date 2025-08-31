import FeedInfo from "@/popup/pages/node-posts/FeedInfo.jsx";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes.js";

import styles from "./PostMetadata.module.css";

export default function PostMetadata(props) {
  return (
    <div class={styles.metadata}>
      <FeedInfo name={props.feedName} favicon={props.feedFavicon} />
      <span class={styles.separator}>◆</span>
      <div title={formatTimestamp(props.publishedAt)}>
        {humanizeTimestamp(props.publishedAt)}
      </div>
    </div>
  );
}
