import { useSearchParams } from "@solidjs/router";
import { Show } from "solid-js";

import { TreeNode } from "@/background/db-setup";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PageTitleButton from "@/popup/components/page-header/PageTitleButton";
import PostsFilter from "@/popup/pages/node/PostsFilter";

import styles from "./NodeHeader.module.css";

export default function NodeHeader(props: NodeHeaderProps) {
  const [searchParams] = useSearchParams();
  const previousUrl = () => {
    if (props.node.type === "folder") {
      return `/library/nodes/${props.node.id}`;
    } else {
      return `/library/nodes/${props.node.parentId}`;
    }
  };

  return (
    <PageHeaderWrapper>
      <BackLink url={previousUrl()} class={styles["previous-url"]} />
      <DeleteNodeProvider>
        <PageTitleButton
          title={props.node.name}
          nodeType={props.node.type}
          nodeId={props.node.id}
          nodeName={props.node.name}
          isRoot={props.node.parentId === null}
        />
        <DeleteNodeDialog />
      </DeleteNodeProvider>
      <Show when={props.node.hasPosts}>
        <PostsFilter
          unreadCount={props.node.unreadCount}
          pageUrl={`/library/nodes/${props.node.id}/posts`}
          initialFilter={searchParams.unread === "true" ? "unread" : "all"}
          class={styles["posts-filter"]}
        />
      </Show>
    </PageHeaderWrapper>
  );
}

interface NodeHeaderProps {
  node: TreeNode & { hasPosts: boolean };
}
