import DialogClose from "@/popup/components/dialog/DialogClose.jsx";

import styles from "./DialogTitle.module.css";

export default function DialogTitle(props) {
  return (
    <div class={styles["dialog-title"]}>
      <h2>{props.children}</h2>
      <DialogClose />
    </div>
  );
}
