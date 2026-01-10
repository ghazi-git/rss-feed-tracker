import { createContext, useContext } from "solid-js";

export const UnreadCountContext = createContext<UnreadCountContextType>();

export function useUnreadCountContext() {
  const context = useContext(UnreadCountContext);
  if (!context) {
    throw new Error("useUnreadCountContext: cannot find UnreadCountContext");
  }

  return context;
}

interface UnreadCountContextType {
  mutateUnreadCount: (args: MutateUnreadCountArgs) => void;
}

export interface MutateUnreadCountArgs {
  delta?: number;
  value?: number;
}
