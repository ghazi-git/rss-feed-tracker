import { createContext, useContext } from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import { PostsQuery } from "@/popup/utils/query";

export const PostsContext = createContext<PostsContextType>();

export function usePostsContext() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePostsContext: cannot find PostsContext.");
  }

  return context;
}

interface PostsContextType {
  query: PostsQuery;
  posts: () => FeedPost[];
  fetchPosts: () => Promise<void>;
  toggleUnread: (
    feedId: number,
    guid: string,
    unread: boolean,
  ) => Promise<void>;
  mutateBookmarked: (feedId: number, guid: string, bookmarked: boolean) => void;
}
