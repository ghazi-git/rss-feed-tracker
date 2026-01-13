import { createContext, useContext } from "solid-js";

export const ReloadFeedsContext = createContext<ReloadFeedsContextType>();

export function useReloadFeedsContext() {
  const context = useContext(ReloadFeedsContext);
  if (!context) {
    throw new Error("useReloadFeedsContext: cannot find ReloadFeedsContext");
  }

  return context;
}

export function getReloadSuccessMessage(newPostsCount: number) {
  if (newPostsCount > 0) {
    return `${newPostsCount} new post${newPostsCount > 1 ? "s" : ""} found.`;
  }
  return "No new posts found.";
}

interface ReloadFeedsContextType {
  mutation: { isLoading: boolean };
  reloadFeeds: (nodeId: number) => Promise<void>;
}
