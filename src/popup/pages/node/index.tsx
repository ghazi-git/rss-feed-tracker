import { Navigate, useParams, useSearchParams } from "@solidjs/router";
import {
  createEffect,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
  untrack,
} from "solid-js";

import { onMessage } from "@/messaging-wrapper";
import Anchor from "@/popup/components/Anchor";
import { useBodyContext } from "@/popup/components/Body";
import { FolderPage } from "@/popup/pages/node/FolderPage";
import {
  getReloadSuccessMessage,
  ReloadFeedsContext,
} from "@/popup/pages/node-posts/reload-feeds-context";
import {
  useCurrentURL,
  useInitialState,
} from "@/popup/utils/last-visited-page";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";
import { createQuery } from "@/popup/utils/query";

import styles from "./index.module.css";
import { NodeContext } from "./node-context";

/**
 * If the node is a folder, display the folder children (feeds and other folders).
 * If the node is a feed, redirect to the feed posts page (NodePosts component)
 */
export default function Node() {
  const params = useParams<{ id: string }>();
  const nodeId = () => parseInt(params.id);
  const {
    query,
    sendMsg: fetchNode,
    mutateData,
  } = createQuery("nodes/get-for-node-page");
  createEffect(() => {
    const id = nodeId();
    untrack(() => {
      fetchNode({ id });
    });
  });

  let isInitialFetch = true;
  const initialState = useInitialState();
  const currentURL = useCurrentURL();
  const { setScrollPosition } = useBodyContext();
  createEffect(() => {
    const isSuccess = query.isSuccess;
    if (isInitialFetch && initialState && isSuccess) {
      isInitialFetch = false;
      if (initialState.url === currentURL()) {
        setScrollPosition(initialState.scrollPosition);
      }
    }
  });

  // listen to notification of new posts to update the unread count
  let notifCleanup: () => void;
  onMount(() => {
    notifCleanup = onMessage("feed-polling/notify-of-new-posts", () => {
      fetchNode({ id: nodeId() });
    });
  });
  onCleanup(() => {
    notifCleanup?.();
  });

  const folderNode = () => {
    const nd = query.data;
    return nd?.type === "folder" ? nd : null;
  };

  const { mutation, sendMsg: reload } = createMutation("nodes/reload");
  const reloadFeeds = async (id: number) => {
    await reload({ id });
    if (mutation.isSuccess) {
      notifySuccess(getReloadSuccessMessage(mutation.data.newPostsCount));
      await fetchNode({ id: nodeId() });
      if (query.isError) {
        notifyError(query.errorMsg);
      }
    } else if (mutation.isError) {
      notifyError(mutation.errorMsg);
    }
  };

  return (
    <NodeContext.Provider value={{ mutateNode: mutateData }}>
      <ReloadFeedsContext.Provider value={{ mutation, reloadFeeds }}>
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
                fallback={<NavigateToPostsPage id={currentNode().id} />}
              >
                {(folder) => <FolderPage folder={folder()} />}
              </Show>
            )}
          </Match>
        </Switch>
      </ReloadFeedsContext.Provider>
    </NodeContext.Provider>
  );
}

function NavigateToPostsPage(props: { id: number }) {
  // forward focusedIndex
  const [searchParams] = useSearchParams<{ focusedIndex?: string }>();
  const search = () =>
    searchParams.focusedIndex
      ? `?focusedIndex=${searchParams.focusedIndex}`
      : "";
  return <Navigate href={`/library/nodes/${props.id}/posts${search()}`} />;
}
