import { createSignal, For, onMount } from "solid-js";

import PostFooter from "@/popup/pages/node-posts/PostFooter.jsx";

import styles from "./Posts.module.css";

export default function Posts(props) {
  return (
    <div class={styles.posts}>
      <For each={props.posts}>{(post) => <Post post={post} />}</For>
    </div>
  );
}

function Post(props) {
  const [showTooltip, setShowTooltip] = createSignal(false);
  let titleRef;
  onMount(() => {
    if (titleRef.scrollHeight > titleRef.clientHeight) {
      setShowTooltip(true);
    }
  });

  return (
    <div class={styles.post}>
      <div
        ref={titleRef}
        title={showTooltip() ? props.post.title : ""}
        class={styles.title}
        dir="auto"
      >
        {props.post.title}
      </div>
      <PostFooter post={props.post} />
    </div>
  );
}
