import { Navigate, useParams } from "@solidjs/router";
import { Show } from "solid-js";

import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PageTitleButton from "@/popup/components/page-header/PageTitleButton";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import styles from "@/popup/pages/node/index.module.css";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import { NODES } from "@/popup/utils/dummy-data";

export default function Node() {
  const params = useParams();
  const node = () => NODES.find((n) => n.id === parseInt(params.id));
  const hasChildren = () => NODES.some((n) => n.parentId === node()?.id);

  return (
    <Show when={node()} fallback={<h2>Folder or Feed not Found</h2>}>
      {(currentNode) => (
        <Show
          when={currentNode().type === "folder"}
          fallback={
            <Navigate href={`/library/nodes/${currentNode().id}/posts`} />
          }
        >
          <DeleteNodeProvider>
            <PageHeaderWrapper>
              <Show
                when={currentNode().parentId}
                fallback={<div class={styles["previous-url-placeholder"]} />}
              >
                <BackLink
                  url={`/library/nodes/${currentNode().parentId}`}
                  class={styles["previous-url"]}
                />
              </Show>
              <PageTitleButton
                title={currentNode().name}
                nodeType={currentNode().type}
                nodeId={currentNode().id}
                nodeName={currentNode().name}
                isRoot={currentNode().parentId === null}
              />
              <Show when={hasChildren()}>
                <PostsFilter
                  unreadCount={currentNode().unreadCount}
                  pageUrl={`/library/nodes/${currentNode().id}/posts`}
                  initialFilter={null}
                  class={styles["posts-filter"]}
                />
              </Show>
            </PageHeaderWrapper>
            <FolderChildren folderId={currentNode().id} />
            <DeleteNodeDialog deletionTriggeredFrom="parentFolderPage" />
          </DeleteNodeProvider>
        </Show>
      )}
    </Show>
  );
}
