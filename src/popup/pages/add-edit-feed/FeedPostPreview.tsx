import { computePosition, flip } from "@floating-ui/dom";

import { usePostMenuContext } from "@/popup/components/context-menu/post-menu-context";
import PostLink from "@/popup/components/PostLink";
import SingleLineText from "@/popup/components/SingleLineText";
import { formatTimestamp, humanizeTimestamp } from "@/popup/utils/datetimes";

import styles from "./FeedPostPreview.module.css";

export function FeedPostPreview(props: PostPreviewProps) {
  const { store, showMenu } = usePostMenuContext();
  return (
    <PostLink
      href={props.url}
      class={styles.post}
      onContextMenu={(event) => {
        event.preventDefault();
        // show custom context menu instead
        const virtualElt = getVirtualElement(event.clientX, event.clientY);
        (async () => {
          const { x, y } = await computePosition(virtualElt, store.menuRef!, {
            placement: "bottom-start",
            middleware: [flip()],
          });
          // button=2 indicates a right-click, otherwise it's keyboard triggered
          // and in that case we should focus the first item according to WAI
          // ARIA rules for menus
          const focusFirstItem = event.button !== 2;
          showMenu(props.url, y, x, focusFirstItem);
        })();
      }}
    >
      <SingleLineText text={props.title} class={styles.title} />
      <div
        class={styles["published-at"]}
        title={formatTimestamp(props.publishedAt)}
      >
        {humanizeTimestamp(props.publishedAt)}
      </div>
    </PostLink>
  );
}

function getVirtualElement(clientX: number, clientY: number) {
  return {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x: clientX,
        left: clientX,
        right: clientX,
        y: clientY,
        top: clientY,
        bottom: clientY,
      };
    },
  };
}

interface PostPreviewProps {
  title: string;
  url: string;
  publishedAt: number;
}
