import { useParams, useSearchParams } from "@solidjs/router";
import {
  batch,
  createEffect,
  createResource,
  createSignal,
  Match,
  Switch,
  untrack,
} from "solid-js";

import { FeedPost, PostsCursor, sendMessage } from "@/messaging-wrapper";
import NodeHeader from "@/popup/pages/node-posts/NodeHeader";
import PostList from "@/popup/pages/node-posts/PostList";
import {
  MutateUnreadCountArgs,
  UnreadCountContext,
} from "@/popup/pages/node-posts/unread-count-context";
import { createPostsQuery } from "@/popup/utils/query";

import styles from "./index.module.css";
import { PostsContext } from "./posts-context";

export default function NodePosts() {
  const [searchParams] = useSearchParams();
  const unread = () => searchParams.unread === "true";
  const postsView = () => (unread() ? "unread" : "all");
  const params = useParams();
  const nodeId = () => parseInt(params.id);

  const [paginationCursor, setPaginationCursor] =
    createSignal<PostsCursor | null>(null);
  const [posts, setPosts] = createSignal<FeedPost[]>([]);
  const { query, fetchPosts } = createPostsQuery("posts/list", () => ({
    nodeId: nodeId(),
    postsView: postsView(),
    cursor: paginationCursor(),
  }));

  // fetch posts when the user switches between the Unread/all posts filter
  createEffect(() => {
    postsView();
    untrack(() => {
      batch(() => {
        // reset the cursor and posts values every time postsView changes
        setPosts([]);
        setPaginationCursor(null);
        fetchPosts();
      });
    });
  });

  // update the pagination cursor and posts after fetching new posts
  createEffect(() => {
    const newPosts = query.data.posts;
    const nextPageCursor = query.data.nextPageCursor;
    batch(() => {
      setPosts((oldPosts) => [...oldPosts, ...newPosts]);
      setPaginationCursor(nextPageCursor);
    });
  });

  const { node, mutateUnreadCount } = createNodeResource();

  return (
    <UnreadCountContext.Provider value={{ mutateUnreadCount }}>
      <PostsContext.Provider
        value={{
          query,
          posts,
          setPosts,
          fetchPosts,
        }}
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

        <PostList postsView={postsView()} nodeId={nodeId()} />
      </PostsContext.Provider>
    </UnreadCountContext.Provider>
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
  const mutateUnreadCount = ({ delta, value }: MutateUnreadCountArgs) => {
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
  return { node, mutateUnreadCount };
}
