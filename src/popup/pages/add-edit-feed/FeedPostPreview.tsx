import PostLink from "@/popup/components/PostLink";
import SingleLineText from "@/popup/components/SingleLineText";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes";

import styles from "./FeedPostPreview.module.css";

export function FeedPostPreview(props: PostPreviewProps) {
  return (
    <PostLink href={props.url} class={styles.post}>
      <SingleLineText text={props.title} class={styles.title} />
      <div
        class={styles["published-at"]}
        title={formatTimestamp(props.publishedAt)}
      >
        {humanizeTimestamp(props.publishedAt)}
      </div>
    </PostLink>
  );
}

interface PostPreviewProps {
  title: string;
  url: string;
  publishedAt: number;
}
