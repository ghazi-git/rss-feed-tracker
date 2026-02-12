import { Match, Show, Switch } from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import ErrorAlert from "@/popup/components/ErrorAlert";
import LoadMorePosts from "@/popup/components/LoadMorePosts";
import LoadNewPosts from "@/popup/components/LoadNewPosts";
import NoMorePosts from "@/popup/components/NoMorePosts";
import NoPosts from "@/popup/components/NoPosts";
import Posts from "@/popup/pages/node-posts/Posts";
import {
  ToggleUnreadContext,
  useToggleUnread,
} from "@/popup/pages/node-posts/toggle-unread-context";
import { notifyError } from "@/popup/utils/notifications";
import { PAGE_SIZE } from "@/utils/settings";

import { usePostsContext } from "./posts-context";
import { ToggleBookmarkedContext } from "./toggle-bookmarked-context";

export default function PostList(props: PostListProps) {
  const { query, posts, setPosts, fetchPosts } = usePostsContext();
  const postsCount = () => posts().length;

  const toggleUnread = useToggleUnread();
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
      setPosts((oldPosts) => {
        return oldPosts.map((post) => {
          if (post.feedId === feedId && post.guid === guid) {
            return { ...post, bookmarked: bookmarked ? 1 : 0 };
          } else {
            return post;
          }
        });
      });
    } else {
      notifyError(resp.errorMsg);
    }
  };
  const noPostsMsg = () =>
    props.postsView === "all" ? "No posts yet." : "No unread posts found.";

  return (
    <Switch>
      <Match when={postsCount() === 0 && query.isError}>
        <NoPosts msg={query.errorMsg!} />
      </Match>
      <Match when={postsCount() === 0 && query.isLoading}>
        <NoPosts msg="Loading posts..." />
      </Match>
      <Match when={postsCount() === 0}>
        <Show
          when={props.hasNewPosts}
          fallback={<NoPosts msg={noPostsMsg()} />}
        >
          <LoadNewPosts onClick={() => props.loadNewPosts()} />
        </Show>
      </Match>
      <Match when={postsCount() > 0}>
        <ErrorAlert errorMsg={query.errorMsg} />
        <Show when={props.hasNewPosts}>
          <LoadNewPosts onClick={() => props.loadNewPosts()} />
        </Show>
        <ToggleBookmarkedContext.Provider value={{ toggleBookmarked }}>
          <ToggleUnreadContext.Provider value={{ toggleUnread }}>
            <Posts posts={posts()} isFolder={props.isFolderNode} />
          </ToggleUnreadContext.Provider>
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

interface PostListProps {
  nodeId: number;
  isFolderNode: boolean;
  postsView: PostsView;
  hasNewPosts: boolean;
  loadNewPosts: () => void;
}
