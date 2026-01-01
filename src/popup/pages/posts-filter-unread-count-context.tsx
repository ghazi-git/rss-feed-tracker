import { createContext, useContext } from "solid-js";

export const PostsFilterUnreadCountContext =
  createContext<PostsFilterUnreadCountContextType>();

export function usePostsFilterUnreadCountContext() {
  const context = useContext(PostsFilterUnreadCountContext);
  // todo uncomment after adding the context to Folder pages
  // if (!context) {
  //   throw new Error(
  //     "usePostsFilterUnreadCountContext: cannot find PostsFilterUnreadCountContext",
  //   );
  // }

  return context;
}

interface PostsFilterUnreadCountContextType {
  markAsReadMutation: {
    markAll: () => Promise<void>;
    isLoading: () => boolean;
    isSuccess: () => boolean;
    isError: () => boolean;
    errorMsg: () => string | null;
    reset: () => void;
  };
  updateUnreadCount: (args: UpdateUnreadCountArgs) => void;
}

export interface UpdateUnreadCountArgs {
  delta?: number;
  value?: number;
}
