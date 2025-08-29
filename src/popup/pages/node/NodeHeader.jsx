import { Show } from "solid-js";

import PageTitle from "@/popup/components/PageTitle.jsx";
import PostsFilter from "@/popup/pages/node/PostsFilter.jsx";

import styles from "./NodeHeader.module.css";

export default function NodeHeader(props) {
  return (
    <div class={styles["node-header"]}>
      <Show when={props.node.parentId}>
        <PageTitle text={props.node.name} />
      </Show>
      <PostsFilter
        unreadCount={props.node.unreadCount}
        nodeId={props.node.id}
      />
    </div>
  );
}
