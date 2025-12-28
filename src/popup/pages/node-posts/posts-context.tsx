import { createContext, useContext } from "solid-js";

export const PostsContext = createContext<PostsContextType>();

export function usePostsContext() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePostsContext: cannot find PostsContext.");
  }

  return context;
}

interface PostsContextType {
  toggleUnread: (feedId: number, guid: string, unread: boolean) => void;
  toggleBookmarked: (feedId: number, guid: string, bookmarked: boolean) => void;
}
