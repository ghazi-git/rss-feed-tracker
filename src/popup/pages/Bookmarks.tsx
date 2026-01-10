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

import { PAGE_SIZE } from "@/background/settings";
import {
  FeedPost,
  PostsCursor,
  PostsView,
  sendMessage,
} from "@/messaging-wrapper";
import ErrorAlert from "@/popup/components/ErrorAlert";
import LoadMorePosts from "@/popup/components/LoadMorePosts";
import NoMorePosts from "@/popup/components/NoMorePosts";
import NoPosts from "@/popup/components/NoPosts";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import Posts from "@/popup/pages/node-posts/Posts";
import {
  PostsContext,
  usePostsContext,
} from "@/popup/pages/node-posts/posts-context";
import {
  PostsFilterUnreadCountContext,
  UpdateUnreadCountArgs,
} from "@/popup/pages/posts-filter-unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";
import { createPostsQuery } from "@/popup/utils/query";

import styles from "./Bookmarks.module.css";

export default function Bookmarks() {
  const [unreadCount, updateUnreadCount] = createUnreadCountSignal();
  const [searchParams] = useSearchParams();
  const unread = () => searchParams.unread === "true";
  const postsView = () => (unread() ? "unread" : "all");

  const [paginationCursor, setPaginationCursor] =
    createSignal<PostsCursor | null>(null);
  const [posts, setPosts] = createSignal<FeedPost[]>([]);
  const { query, fetchPosts } = createPostsQuery("posts/get-bookmarks", () => ({
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
    batch(() => {
      setPosts((oldPosts) => {
        return oldPosts.map((post) => {
          if (post.feedId === feedId && post.guid === guid) {
            return { ...post, bookmarked: bookmarked ? 1 : 0 };
          } else {
            return post;
          }
        });
      });
      const post = posts().find((p) => p.feedId === feedId && p.guid === guid);
      if (post?.unread) {
        updateUnreadCount({ delta: bookmarked ? 1 : -1 });
      }
    });
  };

  const { mutation, sendMsg, reset } = createMutation(
    "posts/mark-all-bookmarks-as-read",
  );
  const markAsReadMutation = {
    async markAll() {
      await sendMsg(undefined);

      if (mutation.isSuccess) {
        batch(() => {
          setPosts((oldPosts) =>
            oldPosts.map((post) => ({ ...post, unread: 0 })),
          );
          updateUnreadCount({ value: 0 });
          reset();
        });
      } else if (mutation.isError) {
        notifyError(mutation.errorMsg);
        reset();
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
        <PageHeaderWrapper>
          <PostsFilter
            pageUrl="/bookmarks"
            unreadCount={unreadCount()}
            initialFilter={unread() ? "unread" : "all"}
            class={styles["posts-filter"]}
          />
        </PageHeaderWrapper>

        <BookmarkedPosts postsView={postsView()} />
      </PostsFilterUnreadCountContext.Provider>
    </PostsContext.Provider>
  );
}

function BookmarkedPosts(props: { postsView: PostsView }) {
  const { query, posts, fetchPosts } = usePostsContext();
  const postsCount = () => posts().length;

  return (
    <Switch>
      <Match when={postsCount() === 0 && query.isError}>
        <NoPosts msg={query.errorMsg!} />
      </Match>
      <Match when={postsCount() === 0 && query.isLoading}>
        <NoPosts msg="Loading bookmarked posts..." />
      </Match>
      <Match when={postsCount() === 0}>
        <NoPosts
          msg={
            props.postsView === "all"
              ? "No posts bookmarked yet."
              : "No unread bookmarks found."
          }
        />
      </Match>
      <Match when={postsCount() > 0}>
        <ErrorAlert errorMsg={query.errorMsg} />
        <Posts posts={posts()} />
        <Show when={query.data.nextPageCursor}>
          <LoadMorePosts
            postsCount={postsCount()}
            loading={query.isLoading}
            onClick={() => {
              fetchPosts();
            }}
          />
        </Show>
        <Show when={!query.data.nextPageCursor && postsCount() >= PAGE_SIZE}>
          <NoMorePosts postsCount={postsCount()} />
        </Show>
      </Match>
    </Switch>
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
