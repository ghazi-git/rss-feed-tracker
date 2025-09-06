import { createContext, useContext } from "solid-js";

export const DropdownContext = createContext();

export function useDropdownContext() {
  const context = useContext(DropdownContext);

  if (!context) {
    throw new Error("useDropdownMenuContext: cannot find a DropdownContext");
  }

  return context;
}
