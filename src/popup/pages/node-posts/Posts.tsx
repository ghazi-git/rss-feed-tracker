import { computePosition, flip } from "@floating-ui/dom";
import { createSignal, For, onMount } from "solid-js";
import { dismissToast } from "solid-notifications";

import {
  PostMenuProvider,
  usePostMenuContext,
} from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import PostLink from "@/popup/components/PostLink";
import PostFooter from "@/popup/pages/node-posts/PostFooter";
import { PostType } from "@/popup/pages/node-posts/types";
import { notifyInfo } from "@/popup/utils/notifications";
import { usePreferencesContext } from "@/popup/utils/preferences-storage";
import { openTab, openWindow } from "@/popup/utils/urls";

import styles from "./Posts.module.css";

export default function Posts(props: { posts: PostType[] }) {
  return (
    <PostMenuProvider>
      <PostContextMenu
        onLinkOpened={(postGUID) => {
          console.log("notify service worker to mark post as read", postGUID);
        }}
      />
      <div class={styles.posts}>
        <For each={props.posts}>{(post) => <Post post={post} />}</For>
      </div>
    </PostMenuProvider>
  );
}

function Post(props: { post: PostType }) {
  const { store: ctxMenu, showMenu } = usePostMenuContext();
  let ref!: HTMLAnchorElement;

  const { store } = usePreferencesContext();
  const [showTooltip, setShowTooltip] = createSignal(false);
  let titleRef!: HTMLDivElement;
  onMount(() => {
    if (titleRef.scrollHeight > titleRef.clientHeight) {
      setShowTooltip(true);
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
          openTab(props.post.url);
        } else if (event.shiftKey) {
          openWindow(props.post.url);
        } else {
          if (store.clickPostToToggleUnread) {
            dismissToast();
            notifyInfo("Toggle unread");
          } else {
            openTab(props.post.url, true);
          }
        }
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          openTab(props.post.url);
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
          showMenu(ref, props.post.url, y, x, focusFirstItem);
        })();
      }}
    >
      <div
        ref={titleRef}
        title={showTooltip() ? props.post.title : ""}
        class={styles.title}
        dir="auto"
      >
        {props.post.title}
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
