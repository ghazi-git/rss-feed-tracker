import { createContext, useContext } from "solid-js";

export const DialogContext = createContext<{ close: CloseDialogType }>();

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialogContext: cannot find a DialogContext");
  }

  return context;
}

export type CloseDialogType = (returnValue?: string) => void;
