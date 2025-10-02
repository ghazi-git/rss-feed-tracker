import { createSignal, For, onMount } from "solid-js";

import PostLink from "@/popup/components/PostLink";
import PostFooter from "@/popup/pages/node-posts/PostFooter";
import { PostType } from "@/popup/pages/node-posts/types";
import { openTab, openWindow } from "@/popup/utils/urls";

import styles from "./Posts.module.css";

export default function Posts(props: { posts: PostType[] }) {
  return (
    <div class={styles.posts}>
      <For each={props.posts}>{(post) => <Post post={post} />}</For>
    </div>
  );
}

function Post(props: { post: PostType }) {
  const [showTooltip, setShowTooltip] = createSignal(false);
  let titleRef!: HTMLDivElement;
  onMount(() => {
    if (titleRef.scrollHeight > titleRef.clientHeight) {
      setShowTooltip(true);
    }
  });

  return (
    <PostLink
      href={props.post.url}
      class={styles.post}
      onClick={(event) => {
        event.preventDefault();
        if (event.ctrlKey) {
          openTab(props.post.url);
        } else if (event.shiftKey) {
          openWindow(props.post.url);
        } else {
          openTab(props.post.url, true);
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          openTab(props.post.url);
        }
      }}
    >
      <div
        ref={titleRef}
        title={showTooltip() ? props.post.title : ""}
        class={styles.title}
        dir="auto"
      >
        {props.post.title}
      </div>
      <PostFooter post={props.post} />
    </PostLink>
  );
}
