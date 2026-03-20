import { useNavigate } from "@solidjs/router";
import { createMemo, Match, Show, Switch } from "solid-js";

import { PostsView, sendMessage } from "@/messaging-wrapper";
import { PostMenuProvider } from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import ErrorAlert from "@/popup/components/ErrorAlert";
import LoadMorePosts from "@/popup/components/LoadMorePosts";
import LoadNewPosts from "@/popup/components/LoadNewPosts";
import NoMorePosts from "@/popup/components/NoMorePosts";
import NoPosts from "@/popup/components/NoPosts";
import { ListNavigationContextProvider } from "@/popup/pages/node/list-navigation-context";
import Posts from "@/popup/pages/node-posts/Posts";
import {
  ToggleUnreadContext,
  useToggleUnread,
} from "@/popup/pages/node-posts/toggle-unread-context";
import { notifyError } from "@/popup/utils/notifications";
import { getGroupedPosts } from "@/popup/utils/posts";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { createShortcut } from "@/popup/utils/shortcuts";
import { PAGE_SIZE } from "@/utils/settings";

import { usePostsContext } from "./posts-context";
import { ToggleBookmarkedContext } from "./toggle-bookmarked-context";

export default function PostList(props: PostListProps) {
  const { query, posts, setPosts, fetchPosts } = usePostsContext();
  const postsCount = () => posts().length;
  const { preferences } = usePreferencesContext();
  const groupPosts = () => props.isFolderNode && preferences.groupFolderPosts;
  const groupedPosts = createMemo(() => {
    if (groupPosts()) {
      const orderByFetchedAt = preferences.orderPostsBy === "fetchedAt";
      return getGroupedPosts(posts(), orderByFetchedAt);
    } else {
      return posts();
    }
  });

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

  const navigate = useNavigate();
  createShortcut("left", () => {
    if (props.isFolderNode) {
      navigate(`/library/nodes/${props.nodeId}?focusedIndex=0`);
    } else if (props.parentNodeId) {
      navigate(`/library/nodes/${props.parentNodeId}?focusedIndex=0`);
    } else {
      navigate("/library");
    }
  });
  const hasMorePosts = () => !!query.data.nextPageCursor;
  createShortcut("l", () => {
    if (hasMorePosts()) fetchPosts();
  });

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
            <ListNavigationContextProvider listLength={postsCount()}>
              <PostMenuProvider>
                <PostContextMenu />
                <Posts posts={groupedPosts()} groupPosts={groupPosts()} />
              </PostMenuProvider>
            </ListNavigationContextProvider>
          </ToggleUnreadContext.Provider>
        </ToggleBookmarkedContext.Provider>
        <Show when={hasMorePosts()}>
          <LoadMorePosts
            postsCount={postsCount()}
            loading={query.isLoading}
            onClick={() => {
              fetchPosts();
            }}
          />
        </Show>
        <Show when={!hasMorePosts() && postsCount() >= PAGE_SIZE}>
          <NoMorePosts postsCount={postsCount()} />
        </Show>
      </Match>
    </Switch>
  );
}

interface PostListProps {
  nodeId: number;
  isFolderNode: boolean;
  parentNodeId: number | null;
  postsView: PostsView;
  hasNewPosts: boolean;
  loadNewPosts: () => void;
}
