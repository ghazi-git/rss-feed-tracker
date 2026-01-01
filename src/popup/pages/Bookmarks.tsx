import { useSearchParams } from "@solidjs/router";
import {
  batch,
  createEffect,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
  untrack,
} from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import ErrorAlert from "@/popup/components/ErrorAlert";
import NoPosts from "@/popup/components/NoPosts";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import Posts from "@/popup/pages/node-posts/Posts";
import { PostsContext } from "@/popup/pages/node-posts/posts-context";
import {
  PostsFilterUnreadCountContext,
  UpdateUnreadCountArgs,
  usePostsFilterUnreadCountContext,
} from "@/popup/pages/posts-filter-unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";
import { createQuery } from "@/popup/utils/query";

import styles from "./Bookmarks.module.css";

export default function Bookmarks() {
  const [unreadCount, updateUnreadCount] = createUnreadCountSignal();
  const markAsReadMutation = createMarkAllAsReadMutation();

  const [searchParams] = useSearchParams();
  const unread = () => searchParams.unread === "true";

  return (
    <PostsFilterUnreadCountContext.Provider
      value={{ markAsReadMutation, updateUnreadCount }}
    >
      <PageHeaderWrapper>
        <PostsFilter
          pageUrl="/bookmarks"
          unreadCount={unreadCount()}
          initialFilter={unread() ? "unread" : "all"}
          class={styles["posts-filter"]}
        />
      </PageHeaderWrapper>
      {/* Intentionally creating separate components instances based on the
       posts view to reset the cursor without complicating the bookmark
       query any further */}
      {unread() ? (
        <BookmarkedPosts postsView="unread" />
      ) : (
        <BookmarkedPosts postsView="all" />
      )}
    </PostsFilterUnreadCountContext.Provider>
  );
}

function BookmarkedPosts(props: { postsView: PostsView }) {
  const { query, fetchPosts, toggleUnread, mutateBookmarked, mutateAllUnread } =
    // eslint-disable-next-line solid/reactivity
    createBookmarksQuery(props.postsView);
  onMount(async () => {
    await fetchPosts();
  });

  const ctx = usePostsFilterUnreadCountContext();
  createEffect(() => {
    const isSuccess = ctx?.markAsReadMutation.isSuccess();
    const isError = ctx?.markAsReadMutation.isError();
    if (isSuccess) {
      batch(() => {
        mutateAllUnread();
        ctx?.updateUnreadCount({ value: 0 });
        ctx?.markAsReadMutation.reset();
      });
    } else if (isError) {
      const msg = ctx?.markAsReadMutation.errorMsg() ?? "";
      if (msg) {
        notifyError(msg);
      }
      ctx?.markAsReadMutation.reset();
    }
  });

  return (
    <PostsContext.Provider value={{ toggleUnread, mutateBookmarked }}>
      <Switch>
        <Match when={query.data.posts.length === 0 && query.isError}>
          <NoPosts msg={query.errorMsg!} />
        </Match>
        <Match when={query.data.posts.length === 0 && query.isLoading}>
          <NoPosts msg="Loading bookmarked posts..." />
        </Match>
        <Match when={query.data.posts.length === 0}>
          <NoPosts
            msg={
              props.postsView === "all"
                ? "No posts bookmarked yet."
                : "No unread bookmarks found."
            }
          />
        </Match>
        <Match when={query.data.posts.length > 0}>
          <ErrorAlert errorMsg={query.errorMsg} />
          <Posts posts={query.data.posts} />
          <Show when={query.data.nextPageCursor}>
            <UnstyledButton
              class={styles["load-more"]}
              disabled={query.isLoading}
              onClick={() => {
                fetchPosts();
              }}
            >
              {query.isLoading ? "Loading..." : "Load more"}
            </UnstyledButton>
          </Show>
        </Match>
      </Switch>
    </PostsContext.Provider>
  );
}

function createUnreadCountSignal() {
  const [unreadCount, setUnreadCount] = createSignal(0);
  onMount(async () => {
    const resp = await sendMessage(
      "posts/get-unread-bookmarks-count",
      undefined,
    );
    if (resp.success) {
      setUnreadCount(resp.data);
    } else {
      notifyError(resp.errorMsg);
    }
  });
  const updateUnreadCount = ({ delta, value }: UpdateUnreadCountArgs) => {
    if (delta) {
      setUnreadCount((prev) => Math.max(prev + delta, 0));
    } else if (value !== undefined) {
      setUnreadCount(value);
    }
  };
  return [unreadCount, updateUnreadCount] as const;
}

function createMarkAllAsReadMutation() {
  const { mutation, sendMsg, reset } = createMutation(
    "posts/mark-all-bookmarks-as-read",
  );
  return {
    async markAll() {
      await sendMsg(undefined);
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
}

function createBookmarksQuery(postsView: PostsView) {
  const ctx = usePostsFilterUnreadCountContext();
  const { query, setQuery, sendMsg } = createQuery(
    "posts/get-bookmarks",
    { posts: [], postsView, cursor: null, nextPageCursor: null },
    (oldData, newData) => {
      return { ...newData, posts: [...oldData.posts, ...newData.posts] };
    },
  );

  const fetchPosts = async () => {
    await sendMsg({ postsView, cursor: query.data.nextPageCursor });
  };
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
        setQuery(
          "data",
          "posts",
          (post) => post.feedId === feedId && post.guid === guid,
          "unread",
          unread ? 1 : 0,
        );
        ctx?.updateUnreadCount({ delta: unread ? 1 : -1 });
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
    batch(() => {
      setQuery(
        "data",
        "posts",
        (post) => post.feedId === feedId && post.guid === guid,
        "bookmarked",
        bookmarked ? 1 : 0,
      );
      const post = query.data.posts.find(
        (p) => p.feedId === feedId && p.guid === guid,
      );
      if (post?.unread) {
        ctx?.updateUnreadCount({ delta: bookmarked ? 1 : -1 });
      }
    });
  };
  const mutateAllUnread = () => {
    const postsCount = untrack(() => query.data.posts.length);
    setQuery("data", "posts", { from: 0, to: postsCount - 1 }, "unread", 0);
  };

  return { query, fetchPosts, toggleUnread, mutateBookmarked, mutateAllUnread };
}
