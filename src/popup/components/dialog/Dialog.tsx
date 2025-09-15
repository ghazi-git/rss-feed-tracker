import { createEffect, JSX, mergeProps } from "solid-js";
import { Portal } from "solid-js/web";

import {
  CloseDialogType,
  DialogContext,
} from "@/popup/components/dialog/context";

import styles from "./Dialog.module.css";

export default function Dialog(props: DialogProps) {
  const mergedProps = mergeProps({ closedby: "any" } as const, props);
  let ref!: HTMLDialogElement;
  const openModal = () => ref.showModal();
  const close: CloseDialogType = (returnValue) => ref.close(returnValue);

  createEffect(() => {
    if (mergedProps.open) {
      openModal();
    }
  });

  return (
    <DialogContext.Provider value={{ close }}>
      <Portal>
        <dialog
          ref={ref}
          onClose={mergedProps.onClose}
          closedby={mergedProps.closedby}
          class={`${styles.dialog} ${mergedProps.class ?? ""}`}
        >
          {mergedProps.children}
        </dialog>
      </Portal>
    </DialogContext.Provider>
  );
}

type FullDialogProps = JSX.DialogHtmlAttributes<HTMLDialogElement>;

interface DialogProps {
  class?: FullDialogProps["class"];
  closedby?: FullDialogProps["closedby"];
  onClose?: FullDialogProps["onClose"];
  open: boolean;
  children: JSX.Element;
}
