import { useParams, useSearchParams } from "@solidjs/router";
import { createResource, Match, Show, Switch } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import NoPosts from "@/popup/components/NoPosts";
import NodeHeader from "@/popup/pages/node-posts/NodeHeader";
import Posts from "@/popup/pages/node-posts/Posts";

import styles from "./index.module.css";

export default function NodePosts() {
  const { node } = createNodeResource();
  const [searchParams] = useSearchParams();
  const noPostsMsg = () => {
    if (searchParams.unread === "true") {
      return "No unread posts";
    } else {
      return "No posts published yet";
    }
  };

  return (
    <DeleteNodeProvider>
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

      <Show when={[].length > 0} fallback={<NoPosts msg={noPostsMsg()} />}>
        <Posts posts={[]} />
      </Show>
      <DeleteNodeDialog />
    </DeleteNodeProvider>
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
  return { node, mutateNode: mutate };
}
