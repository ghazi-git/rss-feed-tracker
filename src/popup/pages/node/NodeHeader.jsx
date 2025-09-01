import { Show } from "solid-js";

import Anchor from "@/popup/components/Anchor.jsx";
import PreviousIcon from "@/popup/components/svg-icons/PreviousIcon.jsx";
import { singleLineEllipsis } from "@/popup/directives/ellipsis.js";
import PostsFilter from "@/popup/pages/node/PostsFilter.jsx";
import { isPostsPage } from "@/popup/utils/posts.js";

import styles from "./NodeHeader.module.css";

export default function NodeHeader(props) {
  const previousUrl = () => {
    if (isPostsPage() && props.node.type === "folder") {
      return `/home/nodes/${props.node.id}`;
    } else {
      return `/home/nodes/${props.node.parentId}`;
    }
  };

  return (
    <div class={styles["node-header"]}>
      <Show when={props.node.parentId || isPostsPage()}>
        <Anchor href={previousUrl()} class={styles["previous-url"]}>
          <PreviousIcon class={styles["previous-icon"]} />
        </Anchor>
        <h2 use:singleLineEllipsis={props.node.name} dir="auto">
          {props.node.name}
        </h2>
      </Show>
      <PostsFilter
        unreadCount={props.node.unreadCount}
        nodeId={props.node.id}
      />
    </div>
  );
}
