import { useSearchParams } from "@solidjs/router";
import { batch, createEffect, createSignal, onMount, untrack } from "solid-js";

import { FeedPost, PostsCursor, sendMessage } from "@/messaging-wrapper";
import { BookmarkedPosts } from "@/popup/pages/bookmarks/BookmarkedPosts";
import BookmarksHeader from "@/popup/pages/bookmarks/BookmarksHeader";
import { PostsContext } from "@/popup/pages/node-posts/posts-context";
import {
  MutateUnreadCountArgs,
  UnreadCountContext,
} from "@/popup/pages/node-posts/unread-count-context";
import { notifyError } from "@/popup/utils/notifications";
import { createQuery } from "@/popup/utils/query";

export default function Bookmarks() {
  const [unreadCount, mutateUnreadCount] = createUnreadCountSignal();
  const [searchParams] = useSearchParams();
  const unread = () => searchParams.unread === "true";
  const postsView = () => (unread() ? "unread" : "all");

  const [paginationCursor, setPaginationCursor] =
    createSignal<PostsCursor | null>(null);
  const [posts, setPosts] = createSignal<FeedPost[]>([]);
  const { query, sendMsg } = createQuery("posts/get-bookmarks", {
    posts: [],
    nextPageCursor: null,
  });
  const fetchPosts = async () => {
    await sendMsg({
      postsView: postsView(),
      cursor: paginationCursor(),
    });
  };

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
        <BookmarksHeader unreadCount={unreadCount()} />
        <BookmarkedPosts postsView={postsView()} />
      </PostsContext.Provider>
    </UnreadCountContext.Provider>
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
  const mutateUnreadCount = ({ delta, value }: MutateUnreadCountArgs) => {
    if (delta) {
      setUnreadCount((prev) => Math.max(prev + delta, 0));
    } else if (value !== undefined) {
      setUnreadCount(value);
    }
  };
  return [unreadCount, mutateUnreadCount] as const;
}
