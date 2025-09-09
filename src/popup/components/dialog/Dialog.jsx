import { createEffect, mergeProps } from "solid-js";
import { Portal } from "solid-js/web";

import { DialogContext } from "@/popup/components/dialog/context.js";

import styles from "./Dialog.module.css";

export default function Dialog(props) {
  const mergedProps = mergeProps({ closedby: "any" }, props);
  let ref;
  const openModal = () => ref.showModal();
  const close = (returnValue) => ref.close(returnValue);

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
