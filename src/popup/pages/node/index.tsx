import { Navigate, useParams } from "@solidjs/router";
import { createResource, Match, Show, Switch } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import Anchor from "@/popup/components/Anchor";
import { FolderPage } from "@/popup/pages/node/FolderPage";

import styles from "./index.module.css";
import { NodeContext } from "./node-context";

/**
 * If the node is a folder, display the folder children (feeds and other folders).
 * If the node is a feed, redirect to the feed posts page (NodePosts component)
 */
export default function Node() {
  const params = useParams();
  const [node, { mutate }] = createResource(
    () => parseInt(params.id),
    getNodeInfo,
  );
  const folderNode = () => {
    const nd = node();
    return nd?.type === "folder" ? nd : null;
  };

  return (
    <NodeContext.Provider value={{ mutateNode: mutate }}>
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
              {(folder) => <FolderPage folder={folder()} />}
            </Show>
          )}
        </Match>
      </Switch>
    </NodeContext.Provider>
  );
}

async function getNodeInfo(id: number) {
  const response = await sendMessage("nodes/get-for-node-page", { id });
  if (!response.success) throw new Error(response.errorMsg);

  return response.data;
}
