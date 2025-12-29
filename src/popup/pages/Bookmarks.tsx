import { useSearchParams } from "@solidjs/router";
import { batch, createSignal, Match, onMount, Show, Switch } from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import ErrorAlert from "@/popup/components/ErrorAlert";
import NoPosts from "@/popup/components/NoPosts";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import {
  BookmarksContext,
  useBookmarksContext,
} from "@/popup/pages/bookmarks-context";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import Posts from "@/popup/pages/node-posts/Posts";
import { PostsContext } from "@/popup/pages/node-posts/posts-context";
import { notifyError } from "@/popup/utils/notifications";
import { createQuery } from "@/popup/utils/query";

import styles from "./Bookmarks.module.css";

export default function Bookmarks() {
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
  const incrementUnread = () => setUnreadCount((prev) => prev + 1);
  const decrementUnread = () => setUnreadCount((prev) => Math.max(prev - 1, 0));

  const [searchParams] = useSearchParams();
  const unread = () => searchParams.unread === "true";

  return (
    <BookmarksContext.Provider value={{ incrementUnread, decrementUnread }}>
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
    </BookmarksContext.Provider>
  );
}

function BookmarkedPosts(props: { postsView: PostsView }) {
  // prettier-ignore
  // eslint-disable-next-line solid/reactivity
  const { query, fetchPosts, toggleUnread, mutateBookmarked } = createBookmarksQuery(props.postsView);
  onMount(async () => {
    await fetchPosts();
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

function createBookmarksQuery(postsView: PostsView) {
  const { incrementUnread, decrementUnread } = useBookmarksContext();
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
        if (unread) {
          incrementUnread();
        } else {
          decrementUnread();
        }
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
        if (bookmarked) {
          incrementUnread();
        } else {
          decrementUnread();
        }
      }
    });
  };

  return { query, fetchPosts, toggleUnread, mutateBookmarked };
}
