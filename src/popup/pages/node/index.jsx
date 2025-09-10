import { Navigate, useParams } from "@solidjs/router";
import { Show } from "solid-js";

import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context.jsx";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog.jsx";
import BackLink from "@/popup/components/page-header/BackLink.jsx";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper.jsx";
import PageTitleButton from "@/popup/components/page-header/PageTitleButton.jsx";
import FolderChildren from "@/popup/pages/node/FolderChildren.jsx";
import styles from "@/popup/pages/node/index.module.css";
import PostsFilter from "@/popup/pages/node/PostsFilter.jsx";
import { NODES } from "@/popup/utils/dummy-data.js";

export default function Node() {
  const params = useParams();
  const node = () => NODES.find((n) => n.id === parseInt(params.id));
  const hasChildren = () => NODES.some((n) => n.parentId === node().id);

  return (
    <Show when={node()} fallback={<h2>Folder or Feed not Found</h2>}>
      <Show
        when={node().type === "folder"}
        fallback={<Navigate href={`/library/nodes/${node().id}/posts`} />}
      >
        <DeleteNodeProvider>
          <PageHeaderWrapper>
            <Show
              when={node().parentId}
              fallback={<div class={styles["previous-url-placeholder"]} />}
            >
              <BackLink
                url={`/library/nodes/${node().parentId}`}
                class={styles["previous-url"]}
              />
            </Show>
            <PageTitleButton
              title={node().name}
              nodeType={node().type}
              nodeId={node().id}
              nodeName={node().name}
              isRoot={node().parentId === null}
            />
            <Show when={hasChildren()}>
              <PostsFilter
                unreadCount={node().unreadCount}
                pageUrl={`/library/nodes/${node().id}/posts`}
                initialFilter={null}
                class={styles["posts-filter"]}
              />
            </Show>
          </PageHeaderWrapper>
          <FolderChildren folderId={node().id} />
          <DeleteNodeDialog />
        </DeleteNodeProvider>
      </Show>
    </Show>
  );
}
