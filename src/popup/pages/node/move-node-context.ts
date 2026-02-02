import { createContext, useContext } from "solid-js";

export const MoveNodeContext = createContext<MoveNodeContextType>();

export function useMoveNodeContext() {
  const context = useContext(MoveNodeContext);
  if (!context) {
    throw new Error("useMoveNodeContext: cannot find MoveNodeContext.");
  }

  return context;
}

interface MoveNodeContextType {
  modeNodeUpOrDown: (nodeId: number, direction: "up" | "down") => void;
}
