import { Navigate, useParams } from "@solidjs/router";
import { createResource, Match, Setter, Show, Switch } from "solid-js";

import { Folder, TreeNode } from "@/background/db-setup";
import { NodeResponse, sendMessage } from "@/messaging-wrapper";
import Anchor from "@/popup/components/Anchor";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import FolderPageHeader from "@/popup/pages/node/FolderPageHeader";
import {
  PostsFilterUnreadCountContext,
  UpdateUnreadCountArgs,
} from "@/popup/pages/posts-filter-unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./index.module.css";

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
            {(folder) => <FolderPage folder={folder()} mutateFolder={mutate} />}
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

function FolderPage(props: FolderPageProps) {
  const updateUnreadCount = ({ delta, value }: UpdateUnreadCountArgs) => {
    if (delta) {
      props.mutateFolder((resp) => {
        if (!resp) return resp;

        return { ...resp, unreadCount: resp.unreadCount + delta };
      });
    } else if (value !== undefined) {
      props.mutateFolder((resp) => {
        if (!resp) return resp;

        return { ...resp, unreadCount: value };
      });
    }
  };

  const { mutation, sendMsg, reset } = createMutation(
    "posts/mark-all-posts-as-read",
  );
  const markAsReadMutation = {
    async markAll() {
      await sendMsg({
        nodeId: props.folder.id,
        markAsReadUntil: props.folder.markAsReadUntil,
      });
      if (mutation.isSuccess) {
        // set the unread count of the folder and all its children to 0
        props.mutateFolder((resp) => {
          if (!resp) return resp;

          const children = resp.children.map((c) => ({ ...c, unreadCount: 0 }));
          return { ...resp, unreadCount: 0, children };
        });
      } else if (mutation.isError) {
        notifyError(mutation.errorMsg);
      }
    },

    isLoading() {
      return mutation.isLoading;
    },

    isSuccess() {
      return mutation.isSuccess;
    },

    isError() {
      return mutation.isError;
    },

    errorMsg() {
      return mutation.errorMsg;
    },

    reset() {
      reset();
    },
  };

  return (
    <PostsFilterUnreadCountContext.Provider
      value={{ markAsReadMutation, updateUnreadCount }}
    >
      <DeleteNodeProvider>
        <FolderPageHeader
          folder={props.folder}
          hasChildren={props.folder.children.length > 0}
        />
        <FolderChildren
          folderId={props.folder.id}
          childNodes={props.folder.children}
        />
        <DeleteNodeDialog updateChildNodes={props.mutateFolder} />
      </DeleteNodeProvider>
    </PostsFilterUnreadCountContext.Provider>
  );
}

interface FolderPageProps {
  mutateFolder: Setter<NodeResponse | undefined>;
  folder: Folder & {
    markAsReadUntil: number;
    children: (TreeNode & { markAsReadUntil: number })[];
  };
}
