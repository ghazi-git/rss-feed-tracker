import { createContext, useContext } from "solid-js";

export const BookmarksContext = createContext<BookmarksContextType>();

export function useBookmarksContext() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error("useBookmarksContext: cannot find BookmarksContext");
  }

  return context;
}

interface BookmarksContextType {
  incrementUnread: () => void;
  decrementUnread: () => void;
}
