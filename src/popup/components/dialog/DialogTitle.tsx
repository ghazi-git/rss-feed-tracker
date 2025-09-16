import { FlowProps } from "solid-js/types/render/component";

import DialogClose from "@/popup/components/dialog/DialogClose";

import styles from "./DialogTitle.module.css";

export default function DialogTitle(props: FlowProps) {
  return (
    <div class={styles["dialog-title"]}>
      <h2>{props.children}</h2>
      <DialogClose />
    </div>
  );
}
