import { preview } from "@/popup/store/link-preview.js";

import styles from "./LinkPreview.module.css";

export default function LinkPreview() {
  return (
    <div
      class={`${styles["link-preview"]} ${preview.show ? styles.visible : ""}`}
    >
      {preview.url}
    </div>
  );
}
