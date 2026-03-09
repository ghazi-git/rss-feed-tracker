import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import {
  batch,
  createEffect,
  createResource,
  createSignal,
  Match,
  onCleanup,
  onMount,
  Switch,
  untrack,
} from "solid-js";
import { createStore } from "solid-js/store";

import {
  FeedPost,
  onMessage,
  PostsCursor,
  sendMessage,
} from "@/messaging-wrapper";
import { useBodyContext } from "@/popup/components/Body";
import NodeHeader from "@/popup/pages/node-posts/NodeHeader";
import PostList from "@/popup/pages/node-posts/PostList";
import {
  getReloadSuccessMessage,
  ReloadFeedsContext,
} from "@/popup/pages/node-posts/reload-feeds-context";
import {
  MutateUnreadCountArgs,
  UnreadCountContext,
} from "@/popup/pages/node-posts/unread-count-context";
import { handleFilterShortcut } from "@/popup/utils/filter";
import {
  useCurrentURL,
  useInitialState,
} from "@/popup/utils/last-visited-page";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";
import { createQuery } from "@/popup/utils/query";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./index.module.css";
import { PostsContext } from "./posts-context";

export default function NodePosts() {
  const [searchParams] = useSearchParams();
  const unread = () => searchParams.unread === "true";
  const postsView = () => (unread() ? "unread" : "all");
  const params = useParams<{ id: string }>();
  const nodeId = () => parseInt(params.id);

  const [paginationCursor, setPaginationCursor] =
    createSignal<PostsCursor | null>(null);
  const [posts, setPosts] = createSignal<FeedPost[]>([]);
  const { query, sendMsg } = createQuery("posts/list", {
    posts: [],
    nextPageCursor: null,
  });

  const fetchPosts = async (pageSize?: number) => {
    await sendMsg({
      nodeId: nodeId(),
      postsView: postsView(),
      cursor: paginationCursor(),
      pageSize,
    });
  };

  const {
    setScrollPosition,
    registerPostsCountCallback,
    removePostsCountCallback,
  } = useBodyContext();
  // eslint-disable-next-line solid/reactivity
  onMount(() => registerPostsCountCallback(() => posts().length));
  onCleanup(() => removePostsCountCallback());

  const initialState = useInitialState();
  // page size for the first request when the last visited page is this one
  let initialPageSize = initialState?.postsCount ?? undefined;
  // fetch posts when the user switches between the Unread/all posts filter
  createEffect(() => {
    postsView();
    untrack(() => {
      batch(() => {
        // When the user reloads the feed, then changes the tab without clicking
        // on "Load new posts", update the unread count since he's going to see
        // the new posts
        if (newPostsStore.hasNewPosts) {
          mutateUnreadCount({ delta: newPostsStore.unreadCountDelta });
          mutateMarkAsReadUntil(newPostsStore.markAsReadUntil);
          setNewPostsStore({
            hasNewPosts: false,
            unreadCountDelta: null,
            markAsReadUntil: null,
          });
        }
        // reset the cursor and posts values every time postsView changes
        setPosts([]);
        setPaginationCursor(null);
        fetchPosts(initialPageSize);
        // only the first request may have a bigger page size
        initialPageSize = undefined;
      });
    });
  });

  // update the pagination cursor and posts after fetching new posts
  let isInitialFetch = true;
  const currentURL = useCurrentURL();
  createEffect(() => {
    const newPosts = query.data.posts;
    const nextPageCursor = query.data.nextPageCursor;
    batch(() => {
      setPosts((oldPosts) => [...oldPosts, ...newPosts]);
      setPaginationCursor(nextPageCursor);
    });
    if (isInitialFetch && initialState && newPosts.length > 0) {
      isInitialFetch = false;
      // schedule restoring the scroll position so it runs AFTER the effect
      // that renders new posts
      setTimeout(() => {
        if (initialState.url === currentURL()) {
          setScrollPosition(initialState.scrollPosition);
        }
      });
    }
  });

  const { node, mutateUnreadCount, mutateMarkAsReadUntil } =
    createNodeResource();
  const isFolderNode = () => node.latest?.type === "folder";
  const [newPostsStore, setNewPostsStore] = createStore<NewPostsStore>({
    hasNewPosts: false,
    unreadCountDelta: null,
    markAsReadUntil: null,
  });
  const { mutation, sendMsg: reload } = createMutation("nodes/reload");
  const reloadFeeds = async (id: number) => {
    await reload({ id });
    if (mutation.isSuccess) {
      notifySuccess(getReloadSuccessMessage(mutation.data.newPostsCount));
      const hasNewPosts = !!mutation.data.newPostsCount;
      if (hasNewPosts) {
        setNewPostsStore(({ unreadCountDelta }) => ({
          hasNewPosts: true,
          markAsReadUntil: mutation.data.markAsReadUntil,
          // add to existing delta when reloading more than once before
          // clicking load new posts
          unreadCountDelta:
            mutation.data.newPostsCount + (unreadCountDelta ?? 0),
        }));
      }
    } else if (mutation.isError) {
      notifyError(mutation.errorMsg);
    }
  };
  const loadNewPosts = () => {
    batch(() => {
      if (newPostsStore.hasNewPosts) {
        mutateUnreadCount({ delta: newPostsStore.unreadCountDelta });
        mutateMarkAsReadUntil(newPostsStore.markAsReadUntil);
        setNewPostsStore({
          hasNewPosts: false,
          unreadCountDelta: null,
          markAsReadUntil: null,
        });
      }
      setPosts([]);
      setPaginationCursor(null);
      fetchPosts();
    });
  };

  // listen to notification of new posts to update the unread count
  let notifCleanup: () => void;
  onMount(() => {
    notifCleanup = onMessage("feed-polling/notify-of-new-posts", () => {
      sendMessage("nodes/get-for-node-posts-page", { id: nodeId() }).then(
        (response) => {
          if (response.success) {
            const currentCount = getCurrentCount();
            const newCount = response.data.unreadCount;
            if (newCount > currentCount) {
              setNewPostsStore(({ unreadCountDelta }) => ({
                hasNewPosts: true,
                unreadCountDelta:
                  newCount - currentCount + (unreadCountDelta ?? 0),
                markAsReadUntil: response.data.markAsReadUntil,
              }));
            }
          }
        },
      );
      const getCurrentCount = () => {
        try {
          // try/catch since reads may throw in createResource
          return node()?.unreadCount ?? 0;
        } catch {
          return 0;
        }
      };
    });
  });
  onCleanup(() => {
    notifCleanup?.();
  });

  const navigate = useNavigate();
  handleFilterShortcut(() => {
    const searchString = getSearchString({
      previousUrl: currentURL(),
      nodeName: node.latest?.name ?? "",
    });
    navigate(`/library/nodes/${nodeId()}/filter?${searchString}`);
  });

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
            {(currentNode) => (
              <ReloadFeedsContext.Provider value={{ mutation, reloadFeeds }}>
                <NodeHeader node={currentNode()} />
              </ReloadFeedsContext.Provider>
            )}
          </Match>
        </Switch>

        <PostList
          postsView={postsView()}
          nodeId={nodeId()}
          isFolderNode={isFolderNode()}
          hasNewPosts={newPostsStore.hasNewPosts}
          loadNewPosts={loadNewPosts}
        />
      </PostsContext.Provider>
    </UnreadCountContext.Provider>
  );
}

function createNodeResource() {
  const params = useParams<{ id: string }>();
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
  const mutateMarkAsReadUntil = (value: number) => {
    mutate((resp) => {
      if (!resp) return resp;

      return { ...resp, markAsReadUntil: value };
    });
  };
  return { node, mutateUnreadCount, mutateMarkAsReadUntil };
}

type NewPostsStore =
  | {
      hasNewPosts: false;
      unreadCountDelta: null;
      markAsReadUntil: null;
    }
  | {
      hasNewPosts: true;
      unreadCountDelta: number;
      markAsReadUntil: number;
    };
