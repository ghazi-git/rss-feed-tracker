import { useSearchParams } from "@solidjs/router";
import { createSignal, Match, onMount, Show, Switch } from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import ErrorAlert from "@/popup/components/ErrorAlert";
import NoPosts from "@/popup/components/NoPosts";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import Posts from "@/popup/pages/node-posts/Posts";
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

  const [searchParams] = useSearchParams();
  const unread = () => searchParams.unread === "true";

  return (
    <>
      <PageHeaderWrapper>
        <PostsFilter
          pageUrl="/bookmarks"
          unreadCount={unreadCount()}
          initialFilter={unread() ? "unread" : "all"}
          class={styles["posts-filter"]}
        />
      </PageHeaderWrapper>
      {/* Intentionally creating separate components instances based on unread
       so that unread change resets the cursor without complicating the bookmark
       resource any further */}
      {unread() ? (
        <BookmarkedPosts postsView="unread" />
      ) : (
        <BookmarkedPosts postsView="all" />
      )}
    </>
  );
}

function BookmarkedPosts(props: { postsView: PostsView }) {
  // prettier-ignore
  // eslint-disable-next-line solid/reactivity
  const initialValue = { posts: [], postsView: props.postsView, cursor: null, nextPageCursor: null };
  const { query, sendMsg } = createQuery(
    "posts/get-bookmarks",
    initialValue,
    (oldData, newData) => {
      return { ...newData, posts: [...oldData.posts, ...newData.posts] };
    },
  );
  onMount(() => {
    sendMsg({ postsView: props.postsView, cursor: null });
  });

  return (
    <Switch>
      <Match when={query.data.posts.length === 0 && query.isError}>
        <NoPosts msg={query.errorMsg!} />
      </Match>
      <Match when={query.data.posts.length === 0 && query.isLoading}>
        <NoPosts msg="Loading bookmarked posts..." />
      </Match>
      <Match when={query.data.posts.length > 0}>
        <ErrorAlert errorMsg={query.errorMsg} />
        <Posts posts={query.data.posts} />
        <Show when={query.data.nextPageCursor}>
          <UnstyledButton
            class={styles["load-more"]}
            disabled={query.isLoading}
            onClick={() => {
              sendMsg({
                postsView: props.postsView,
                cursor: query.data.nextPageCursor,
              });
            }}
          >
            {query.isLoading ? "Loading..." : "Load more"}
          </UnstyledButton>
        </Show>
      </Match>
    </Switch>
  );
}
