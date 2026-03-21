import { computePosition, flip } from "@floating-ui/dom";
import {
  createEffect,
  createMemo,
  createSignal,
  onMount,
  ParentProps,
} from "solid-js";

import { FeedPost } from "@/messaging-wrapper";
import { usePostMenuContext } from "@/popup/components/context-menu/post-menu-context";
import PostLink from "@/popup/components/PostLink";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import PostFooter from "@/popup/pages/node-posts/PostFooter";
import { useToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import { showLinkPreview } from "@/popup/store/link-preview";
import { getListItemFromPost, isFocusedPost } from "@/popup/utils/keyboard-nav";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { openTab, openWindow } from "@/popup/utils/urls";

import styles from "./Post.module.css";

export default function Post(props: PostProps) {
  const { store: ctxMenu, showMenu } = usePostMenuContext();
  let ref!: HTMLAnchorElement;

  const { toggleUnread } = useToggleUnreadContext();
  const { preferences } = usePreferencesContext();
  const [showTooltip, setShowTooltip] = createSignal(false);
  let titleRef!: HTMLDivElement;
  onMount(() => {
    if (titleRef.scrollHeight > titleRef.clientHeight) {
      setShowTooltip(true);
    }
  });
  const { focusedItem, setFocusedItem } = useListNavigationContext();
  const tabindex = createMemo(() => {
    const item = focusedItem();
    // when no item is focused, make the first one focusable
    if (item === null && props.postIndex === 0) return 0;
    // this item is focused
    else if (isFocusedPost(item, props.post.feedId, props.post.guid)) return 0;
    else return -1;
  });
  createEffect(() => {
    if (isFocusedPost(focusedItem(), props.post.feedId, props.post.guid)) {
      ref.scrollIntoView({ behavior: "auto", block: "nearest" });
      ref.focus();
    }
  });

  return (
    <PostLink
      ref={ref}
      href={props.post.url}
      class={styles.post}
      onClick={(event) => {
        event.preventDefault();
        if (event.ctrlKey) {
          if (props.post.unread) {
            toggleUnread(props.post.feedId, props.post.guid, false);
          }
          openTab(props.post.url);
        } else if (event.shiftKey) {
          if (props.post.unread) {
            toggleUnread(props.post.feedId, props.post.guid, false);
          }
          openWindow(props.post.url);
        } else {
          if (preferences.clickPostToToggleUnread) {
            toggleUnread(
              props.post.feedId,
              props.post.guid,
              !props.post.unread,
            );
          } else {
            if (props.post.unread) {
              toggleUnread(props.post.feedId, props.post.guid, false);
            }
            openTab(props.post.url, true);
          }
        }
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          // middle mouse btn click
          event.preventDefault();
          openTab(props.post.url);
          if (props.post.unread) {
            toggleUnread(props.post.feedId, props.post.guid, false);
          }
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        // show custom context menu instead
        const virtualElt = getVirtualElement(event.clientX, event.clientY);
        (async () => {
          const { x, y } = await computePosition(virtualElt, ctxMenu.menuRef!, {
            placement: "bottom-start",
            middleware: [flip()],
          });
          // button=2 indicates a right-click, otherwise it's keyboard triggered
          // and in that case we should focus the first item according to WAI
          // ARIA rules for menus
          const focusFirstItem = event.button !== 2;
          if (props.post.unread) {
            const feedId = props.post.feedId;
            const guid = props.post.guid;
            showMenu(ref, props.post.url, y, x, focusFirstItem, feedId, guid);
          } else {
            showMenu(ref, props.post.url, y, x, focusFirstItem);
          }
        })();
      }}
      role="listitem"
      tabindex={tabindex()}
      onFocus={() => {
        // update the focusedItem when tabbing into the element as opposed
        // to pressing arrowDown
        if (focusedItem() === null) {
          const item = getListItemFromPost(props.post);
          setFocusedItem(item);
        }

        showLinkPreview(props.post.url);
      }}
    >
      <div
        ref={titleRef}
        title={showTooltip() ? props.post.title : ""}
        class={styles.title}
        dir="auto"
      >
        {props.children ?? props.post.title}
      </div>
      <PostFooter post={props.post} />
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

interface PostProps extends ParentProps {
  post: FeedPost;
  postIndex: number;
}
