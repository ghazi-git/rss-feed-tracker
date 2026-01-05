import styles from "./NoMorePosts.module.css";

export default function NoMorePosts(props: { postsCount: number }) {
  return (
    <div class={styles["no-more-more"]}>
      No more posts
      <span>({props.postsCount} posts total)</span>
    </div>
  );
}
