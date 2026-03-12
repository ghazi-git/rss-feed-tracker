import { useNavigate, useSearchParams } from "@solidjs/router";
import {
  batch,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";

import { FeedPost, PostsCursor, sendMessage } from "@/messaging-wrapper";
import { useBodyContext } from "@/popup/components/Body";
import { BookmarkedPosts } from "@/popup/pages/bookmarks/BookmarkedPosts";
import BookmarksHeader from "@/popup/pages/bookmarks/BookmarksHeader";
import { PostsContext } from "@/popup/pages/node-posts/posts-context";
import {
  MutateUnreadCountArgs,
  UnreadCountContext,
} from "@/popup/pages/node-posts/unread-count-context";
import { handleFilterShortcut } from "@/popup/utils/filter";
import {
  useCurrentURL,
  useInitialState,
} from "@/popup/utils/last-visited-page";
import { notifyError } from "@/popup/utils/notifications";
import { createQuery } from "@/popup/utils/query";
import { useSearchIndexState } from "@/popup/utils/search";
import { getSearchString } from "@/popup/utils/urls";

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
  const fetchPosts = async (pageSize?: number) => {
    await sendMsg({
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

  const isSearchIndexReady = useSearchIndexState();
  const navigate = useNavigate();
  handleFilterShortcut(() => {
    const searchString = getSearchString({ previousUrl: currentURL() });
    if (isSearchIndexReady()) {
      navigate(`/bookmarks/search?${searchString}`);
    } else {
      navigate(`/bookmarks/filter?${searchString}`);
    }
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
