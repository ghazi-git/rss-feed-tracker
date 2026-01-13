import { Accessor, createContext, Setter, useContext } from "solid-js";

import { FeedPost, PostsResponse } from "@/messaging-wrapper";
import { Query } from "@/popup/utils/query";

export const PostsContext = createContext<PostsContextType>();

export function usePostsContext() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePostsContext: cannot find PostsContext.");
  }

  return context;
}

interface PostsContextType {
  query: Query<PostsResponse, PostsResponse>;
  posts: Accessor<FeedPost[]>;
  setPosts: Setter<FeedPost[]>;
  fetchPosts: () => Promise<void>;
}
