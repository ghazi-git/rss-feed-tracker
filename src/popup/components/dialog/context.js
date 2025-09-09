import { createContext, useContext } from "solid-js";

export const DialogContext = createContext();

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialogContext: cannot find a DialogContext");
  }

  return context;
}
