import { Navigate, useParams } from "@solidjs/router";
import { createResource, Match, Show, Switch } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import Anchor from "@/popup/components/Anchor";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import FolderPageHeader from "@/popup/pages/node/FolderPageHeader";

import styles from "./index.module.css";

export default function Node() {
  const params = useParams();
  const [node, { refetch }] = createResource(
    () => parseInt(params.id),
    getNodeInfo,
  );
  const folderNode = () => {
    const nd = node();
    return nd?.type === "folder" ? nd : null;
  };

  return (
    <Switch>
      <Match when={node.error}>
        <div class={`${styles.centered} ${styles.error}`}>
          <span>{node.error.message || "An unexpected error occurred"}</span>
          <Anchor href="/library" replace={true} class="btn">
            Go back to Library
          </Anchor>
        </div>
      </Match>
      <Match when={node.loading}>
        <div class={styles.centered}>Loading feeds...</div>
      </Match>
      <Match when={node()}>
        {(currentNode) => (
          <Show
            when={folderNode()}
            fallback={
              <Navigate href={`/library/nodes/${currentNode().id}/posts`} />
            }
          >
            {(folder) => (
              <DeleteNodeProvider>
                <FolderPageHeader
                  folder={folder()}
                  hasChildren={folder().children.length > 0}
                />
                <FolderChildren
                  folderId={folder().id}
                  childNodes={folder().children}
                />
                <DeleteNodeDialog reloadChildNodes={refetch} />
              </DeleteNodeProvider>
            )}
          </Show>
        )}
      </Match>
    </Switch>
  );
}

async function getNodeInfo(id: number) {
  const response = await sendMessage("nodes/get", { id });
  if (!response.success) throw new Error(response.errorMsg);

  return response.data;
}
