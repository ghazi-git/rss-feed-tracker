import { createContext, useContext } from "solid-js";

export const ToggleBookmarkedContext =
  createContext<ToggleBookmarkedContextType>();

export function useToggleBookmarkedContext() {
  const context = useContext(ToggleBookmarkedContext);
  if (!context) {
    throw new Error(
      "useToggleBookmarkedContext: cannot find ToggleBookmarkedContext",
    );
  }

  return context;
}

interface ToggleBookmarkedContextType {
  toggleBookmarked: (
    feedId: number,
    guid: string,
    bookmarked: boolean,
  ) => Promise<void>;
}
