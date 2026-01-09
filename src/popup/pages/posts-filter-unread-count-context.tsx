import { createContext, useContext } from "solid-js";

export const PostsFilterUnreadCountContext =
  createContext<PostsFilterUnreadCountContextType>();

export function usePostsFilterUnreadCountContext() {
  const context = useContext(PostsFilterUnreadCountContext);
  if (!context) {
    throw new Error(
      "usePostsFilterUnreadCountContext: cannot find PostsFilterUnreadCountContext",
    );
  }

  return context;
}

interface PostsFilterUnreadCountContextType {
  markAsReadMutation: {
    markAll: () => Promise<void>;
    isLoading: () => boolean;
  };
  updateUnreadCount: (args: UpdateUnreadCountArgs) => void;
}

export interface UpdateUnreadCountArgs {
  delta?: number;
  value?: number;
}
