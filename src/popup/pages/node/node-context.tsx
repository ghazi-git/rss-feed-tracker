import { createContext, useContext } from "solid-js";

import { NodeResponse } from "@/messaging-wrapper";

export const NodeContext = createContext<NodeContextType>();

export function useNodeContext() {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error("useNodeContext: cannot find NodeContext.");
  }

  return context;
}

interface NodeContextType {
  mutateNode: (setterFunc: (oldValue: NodeResponse) => NodeResponse) => void;
}
