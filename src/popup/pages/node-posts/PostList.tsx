import {
  batch,
  createEffect,
  Match,
  onMount,
  Show,
  Switch,
  untrack,
} from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import ErrorAlert from "@/popup/components/ErrorAlert";
import LoadMorePosts from "@/popup/components/LoadMorePosts";
import NoPosts from "@/popup/components/NoPosts";
import Posts from "@/popup/pages/node-posts/Posts";
import { usePostsFilterUnreadCountContext } from "@/popup/pages/posts-filter-unread-count-context";
import { notifyError } from "@/popup/utils/notifications";
import { createQuery } from "@/popup/utils/query";

import { PostsContext } from "./posts-context";

export default function PostList(props: PostListProps) {
  const { query, fetchPosts, toggleUnread, mutateBookmarked, mutateAllUnread } =
    // eslint-disable-next-line solid/reactivity
    createPostsQuery(props.nodeId, props.postsView);
  onMount(async () => {
    await fetchPosts();
  });

  const { markAsReadMutation, updateUnreadCount } =
    usePostsFilterUnreadCountContext();
  createEffect(() => {
    const isSuccess = markAsReadMutation.isSuccess();
    const isError = markAsReadMutation.isError();
    if (isSuccess) {
      batch(() => {
        mutateAllUnread();
        updateUnreadCount({ value: 0 });
        markAsReadMutation.reset();
      });
    } else if (isError) {
      const msg = markAsReadMutation.errorMsg() ?? "";
      if (msg) {
        notifyError(msg);
      }
      markAsReadMutation.reset();
    }
  });

  return (
    <PostsContext.Provider value={{ toggleUnread, mutateBookmarked }}>
      <Switch>
        <Match when={query.data.posts.length === 0 && query.isError}>
          <NoPosts msg={query.errorMsg!} />
        </Match>
        <Match when={query.data.posts.length === 0 && query.isLoading}>
          <NoPosts msg="Loading posts..." />
        </Match>
        <Match when={query.data.posts.length === 0}>
          <NoPosts
            msg={
              props.postsView === "all"
                ? "No posts yet."
                : "No unread posts found."
            }
          />
        </Match>
        <Match when={query.data.posts.length > 0}>
          <ErrorAlert errorMsg={query.errorMsg} />
          <Posts posts={query.data.posts} />
          <Show when={query.data.nextPageCursor}>
            <LoadMorePosts
              loading={query.isLoading}
              onClick={() => {
                fetchPosts();
              }}
            />
          </Show>
        </Match>
      </Switch>
    </PostsContext.Provider>
  );
}

function createPostsQuery(nodeId: number, postsView: PostsView) {
  const { updateUnreadCount } = usePostsFilterUnreadCountContext();
  const { query, setQuery, sendMsg } = createQuery(
    "posts/list",
    { posts: [], postsView, cursor: null, nextPageCursor: null },
    (oldData, newData) => {
      return { ...newData, posts: [...oldData.posts, ...newData.posts] };
    },
  );

  const fetchPosts = async () => {
    await sendMsg({ nodeId, postsView, cursor: query.data.nextPageCursor });
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
    setQuery(
      "data",
      "posts",
      (post) => post.feedId === feedId && post.guid === guid,
      "bookmarked",
      bookmarked ? 1 : 0,
    );
  };
  const mutateAllUnread = () => {
    const postsCount = untrack(() => query.data.posts.length);
    setQuery("data", "posts", { from: 0, to: postsCount - 1 }, "unread", 0);
  };

  return { query, fetchPosts, toggleUnread, mutateBookmarked, mutateAllUnread };
}

interface PostListProps {
  nodeId: number;
  postsView: PostsView;
}
