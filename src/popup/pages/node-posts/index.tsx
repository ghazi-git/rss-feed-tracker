import { useParams, useSearchParams } from "@solidjs/router";
import { createResource, Match, Switch } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import NodeHeader from "@/popup/pages/node-posts/NodeHeader";
import PostList from "@/popup/pages/node-posts/PostList";
import {
  PostsFilterUnreadCountContext,
  UpdateUnreadCountArgs,
} from "@/popup/pages/posts-filter-unread-count-context";
import { createMutation } from "@/popup/utils/mutation";

import styles from "./index.module.css";

export default function NodePosts() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const nodeId = () => parseInt(params.id);

  const { node, updateUnreadCount } = createNodeResource();
  const { mutation, sendMsg, reset } = createMutation(
    "posts/mark-all-posts-as-read",
  );
  const markAsReadMutation = {
    async markAll() {
      const markAsReadUntil = node()?.markAsReadUntil;
      if (markAsReadUntil) {
        await sendMsg({ nodeId: nodeId(), markAsReadUntil });
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
      <Switch>
        <Match when={node.error}>
          <div class={styles.error}>
            {node.error.message || "An unexpected error occurred"}
          </div>
        </Match>
        <Match when={node.loading}>
          <div class={styles["blank-space-while-loading-header"]} />
        </Match>
        <Match when={node()}>
          {(currentNode) => <NodeHeader node={currentNode()} />}
        </Match>
      </Switch>

      {/* Intentionally creating separate components instances based on the
       posts view to reset the cursor without complicating the posts query
       any further */}
      {searchParams.unread === "true" ? (
        <PostList postsView="unread" nodeId={nodeId()} />
      ) : (
        <PostList postsView="all" nodeId={nodeId()} />
      )}
    </PostsFilterUnreadCountContext.Provider>
  );
}

function createNodeResource() {
  const params = useParams();
  const [node, { mutate }] = createResource(
    () => parseInt(params.id),
    async (id) => {
      const response = await sendMessage("nodes/get-for-node-posts-page", {
        id,
      });
      if (!response.success) throw new Error(response.errorMsg);

      return response.data;
    },
  );
  const updateUnreadCount = ({ delta, value }: UpdateUnreadCountArgs) => {
    if (delta) {
      mutate((resp) => {
        if (!resp) return resp;

        return { ...resp, unreadCount: resp.unreadCount + delta };
      });
    } else if (value !== undefined) {
      mutate((resp) => {
        if (!resp) return resp;

        return { ...resp, unreadCount: value };
      });
    }
  };
  return { node, updateUnreadCount };
}
