import { batch, Match, Show, Switch } from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import ErrorAlert from "@/popup/components/ErrorAlert";
import LoadMorePosts from "@/popup/components/LoadMorePosts";
import NoMorePosts from "@/popup/components/NoMorePosts";
import NoPosts from "@/popup/components/NoPosts";
import Posts from "@/popup/pages/node-posts/Posts";
import { usePostsContext } from "@/popup/pages/node-posts/posts-context";
import { ToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { ToggleUnreadContextProvider } from "@/popup/pages/node-posts/toggle-unread-context";
import { useUnreadCountContext } from "@/popup/pages/node-posts/unread-count-context";
import { notifyError } from "@/popup/utils/notifications";
import { PAGE_SIZE } from "@/utils/settings";

export function BookmarkedPosts(props: { postsView: PostsView }) {
  const { mutateUnreadCount } = useUnreadCountContext();
  const { query, posts, setPosts, fetchPosts } = usePostsContext();
  const postsCount = () => posts().length;

  const toggleBookmarked = async (
    feedId: number,
    guid: string,
    bookmarked: boolean,
  ) => {
    const resp = await sendMessage("posts/toggle-bookmarked", {
      feedId,
      guid,
      bookmarked,
    });
    if (resp.success) {
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
        const post = posts().find(
          (p) => p.feedId === feedId && p.guid === guid,
        );
        if (post?.unread) {
          mutateUnreadCount({ delta: bookmarked ? 1 : -1 });
        }
      });
    } else {
      notifyError(resp.errorMsg);
    }
  };

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
        <ToggleBookmarkedContext.Provider value={{ toggleBookmarked }}>
          <ToggleUnreadContextProvider>
            <Posts posts={posts()} isFolder={true} />
          </ToggleUnreadContextProvider>
        </ToggleBookmarkedContext.Provider>
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
