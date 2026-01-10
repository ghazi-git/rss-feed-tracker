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
  PostsFilterUnreadCountContext,
  UpdateUnreadCountArgs,
} from "@/popup/pages/posts-filter-unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";
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
  const { query, fetchPosts } = createPostsQuery(() => ({
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

  const { node, updateUnreadCount } = createNodeResource();
  const toggleUnread = async (
    feedId: number,
    guid: string,
    unread: boolean,
  ) => {
    const resp = await sendMessage("posts/toggle-unread", {
      feedId,
      guid,
      unread,
    });
    if (resp.success) {
      batch(() => {
        setPosts((oldPosts) => {
          return oldPosts.map((post) => {
            if (post.feedId === feedId && post.guid === guid) {
              return { ...post, unread: unread ? 1 : 0 };
            } else {
              return post;
            }
          });
        });
        updateUnreadCount({ delta: unread ? 1 : -1 });
      });
    } else {
      notifyError(resp.errorMsg);
    }
  };
  const mutateBookmarked = (
    feedId: number,
    guid: string,
    bookmarked: boolean,
  ) => {
    setPosts((oldPosts) => {
      return oldPosts.map((post) => {
        if (post.feedId === feedId && post.guid === guid) {
          return { ...post, bookmarked: bookmarked ? 1 : 0 };
        } else {
          return post;
        }
      });
    });
  };

  const {
    mutation,
    sendMsg: markAsRead,
    reset,
  } = createMutation("posts/mark-all-posts-as-read");
  const markAsReadMutation = {
    async markAll() {
      const markAsReadUntil = node()?.markAsReadUntil;
      if (markAsReadUntil) {
        await markAsRead({ nodeId: nodeId(), markAsReadUntil });

        if (mutation.isSuccess) {
          batch(() => {
            setPosts((oldPosts) =>
              oldPosts.map((post) => ({ ...post, unread: 0 })),
            );
            updateUnreadCount({ value: 0 });
            reset();
          });
        } else if (mutation.isError) {
          if (mutation.errorMsg) {
            notifyError(mutation.errorMsg);
          }
          reset();
        }
      }
    },

    isLoading() {
      return mutation.isLoading;
    },
  };

  return (
    <PostsContext.Provider
      value={{
        query,
        posts,
        fetchPosts,
        toggleUnread,
        mutateBookmarked,
      }}
    >
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

        <PostList postsView={postsView()} nodeId={nodeId()} />
      </PostsFilterUnreadCountContext.Provider>
    </PostsContext.Provider>
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
