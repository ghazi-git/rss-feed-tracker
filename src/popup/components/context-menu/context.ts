import { createContext, useContext } from "solid-js";

export const ContextMenuContext = createContext<ContextMenuContextType>();

export function useContextMenuContext() {
  const context = useContext(ContextMenuContext);

  if (!context) {
    throw new Error("useContextMenuContext: cannot find a ContextMenuContext");
  }

  return context;
}

interface ContextMenuContextType {
  registerItem: (ref: ContextMenuItemRef) => void;
  unregisterItem: (ref: ContextMenuItemRef) => void;
  focusItemByRef: (ref: ContextMenuItemRef) => void;
}

export type ContextMenuItemPosition = "first" | "last" | "next" | "previous";
export type ContextMenuItemRef = HTMLDivElement;
