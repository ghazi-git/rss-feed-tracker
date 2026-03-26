import { preview } from "@/popup/utils/link-preview";

import styles from "./LinkPreview.module.css";

/**
 * The component acts like the link preview that the browser natively shows
 * at the bottom left.
 *
 * However, this component can remain visible if:
 * - the mouse hovers over a link that is immediately on the extension popup
 * boundary (e.g. bottom link in a scrollable feed page),
 * - then the mouse goes out of the extension popup boundary
 *
 * The reason is that chrome does not report the mouseout event in this case
 * (aside from adding an intentional padding to the bottom which didn't look
 * good, so nothing done)
 */
export default function LinkPreview() {
  return (
    <div
      class={`${styles["link-preview"]} ${preview.show ? styles.visible : ""}`}
    >
      {previewURL(preview.url)}
    </div>
  );
}

function previewURL(url: string) {
  try {
    return decodeURI(preview.url);
  } catch {
    return url;
  }
}
