import CommentsIcon from "@/popup/components/svg-icons/CommentsIcon";
import { hideLinkPreview, showLinkPreview } from "@/popup/store/link-preview";
import { openTab, openWindow } from "@/popup/utils/urls";

import styles from "./CommentsLink.module.css";

export default function CommentsLink(props: { url: string }) {
  const openLink = (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.ctrlKey) {
      openTab(props.url);
    } else if (event.shiftKey) {
      openWindow(props.url);
    } else {
      openTab(props.url, true);
    }
  };

  return (
    <div
      class={styles.link}
      role="link"
      tabindex="0"
      title="Open comments link"
      onClick={(event) => {
        openLink(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          openLink(event);
        }
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          // middle mouse btn click
          event.preventDefault();
          event.stopPropagation();
          openTab(props.url);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onMouseOver={(event) => {
        event.stopPropagation();
        showLinkPreview(props.url);
      }}
      onMouseOut={(event) => {
        event.stopPropagation();
        hideLinkPreview();
      }}
      onFocus={(event) => {
        event.stopPropagation();
        showLinkPreview(props.url);
      }}
      onBlur={(event) => {
        event.stopPropagation();
        hideLinkPreview();
      }}
    >
      <CommentsIcon />
    </div>
  );
}
