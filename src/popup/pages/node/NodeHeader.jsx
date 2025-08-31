import { Show } from "solid-js";

import PageTitle from "@/popup/components/PageTitle.jsx";
import PostsFilter from "@/popup/pages/node/PostsFilter.jsx";
import { isPostsPage } from "@/popup/utils/posts.js";

import styles from "./NodeHeader.module.css";

export default function NodeHeader(props) {
  return (
    <div class={styles["node-header"]}>
      <Show when={props.node.parentId || isPostsPage()}>
        <PageTitle text={props.node.name} />
      </Show>
      <PostsFilter
        unreadCount={props.node.unreadCount}
        nodeId={props.node.id}
      />
    </div>
  );
}
