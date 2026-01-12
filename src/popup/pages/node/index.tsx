import { Navigate, useParams } from "@solidjs/router";
import { createEffect, Match, Show, Switch, untrack } from "solid-js";

import Anchor from "@/popup/components/Anchor";
import { FolderPage } from "@/popup/pages/node/FolderPage";
import { createQuery } from "@/popup/utils/query";

import styles from "./index.module.css";
import { NodeContext } from "./node-context";

/**
 * If the node is a folder, display the folder children (feeds and other folders).
 * If the node is a feed, redirect to the feed posts page (NodePosts component)
 */
export default function Node() {
  const params = useParams();
  const nodeId = () => parseInt(params.id);
  const { query, sendMsg, mutateData } = createQuery("nodes/get-for-node-page");
  createEffect(() => {
    const id = nodeId();
    untrack(() => {
      sendMsg({ id });
    });
  });

  const folderNode = () => {
    const nd = query.data;
    return nd?.type === "folder" ? nd : null;
  };

  return (
    <NodeContext.Provider value={{ mutateNode: mutateData }}>
      <Switch>
        <Match when={!query.data && query.isError}>
          <div class={`${styles.centered} ${styles.error}`}>
            <span>{query.errorMsg}</span>
            <Anchor href="/library" replace={true} class="btn">
              Go back to Library
            </Anchor>
          </div>
        </Match>
        <Match when={!query.data && query.isLoading}>
          <div class={styles.centered}>Loading feeds...</div>
        </Match>
        <Match when={query.data}>
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
