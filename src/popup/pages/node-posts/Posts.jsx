import { A } from "@solidjs/router";
import { createSignal, For, onMount } from "solid-js";

import PostFooter from "@/popup/pages/node-posts/PostFooter.jsx";
import {
  hideLinkPreview,
  showLinkPreview,
} from "@/popup/store/link-preview.js";

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
    <A
      href={props.post.url}
      class={styles.post}
      onClick={(event) => {
        event.preventDefault();
        const active = !event.ctrlKey;
        openTab(props.post.url, active);
      }}
      onContextMenu={(event) => event.preventDefault()}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          openTab(props.post.url);
        }
      }}
      onMouseOver={() => showLinkPreview(props.post.url)}
      onMouseOut={() => hideLinkPreview()}
      onFocus={() => showLinkPreview(props.post.url)}
      onBlur={() => hideLinkPreview()}
      draggable="false"
      activeClass=""
      inactiveClass=""
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
    </A>
  );
}

function openTab(url, active = false) {
  chrome.tabs.create({ url, active }); /* eslint-disable-line no-undef */
}
