import ContextMenu from "@/popup/components/context-menu/ContextMenu";
import ContextMenuItem from "@/popup/components/context-menu/ContextMenuItem";
import ContextMenuSeparator from "@/popup/components/context-menu/ContextMenuSeparator";
import { usePostMenuContext } from "@/popup/components/context-menu/post-menu-context";
import { usePostsContext } from "@/popup/pages/node-posts/posts-context";
import { notifyError } from "@/popup/utils/notifications";
import { openTab, openWindow } from "@/popup/utils/urls";

export function PostContextMenu() {
  const { store, registerMenuRef, hideMenu } = usePostMenuContext();
  const { toggleUnread } = usePostsContextWithDefault();

  return (
    <ContextMenu
      ref={(elt) => {
        registerMenuRef(elt);
      }}
      shown={store.shown}
      top={store.position.top!}
      left={store.position.left!}
      focusFirstItem={store.focusFirstItem}
      closeContextMenu={() => {
        store.triggerRef?.focus();
        hideMenu();
      }}
      aria-label="Post Options"
    >
      <ContextMenuItem
        onSelected={() => {
          if (toggleUnread && store.feedId && store.guid) {
            toggleUnread(store.feedId, store.guid, false);
          }
          openTab(store.url!);
          store.triggerRef?.focus();
          hideMenu();
        }}
      >
        Open link in new tab
      </ContextMenuItem>
      <ContextMenuItem
        onSelected={() => {
          if (toggleUnread && store.feedId && store.guid) {
            toggleUnread(store.feedId, store.guid, false);
          }
          openWindow(store.url!);
          store.triggerRef?.focus();
          hideMenu();
        }}
      >
        Open link in new window
      </ContextMenuItem>
      <ContextMenuItem
        onSelected={() => {
          if (toggleUnread && store.feedId && store.guid) {
            toggleUnread(store.feedId, store.guid, false);
          }
          openWindow(store.url!, true);
          store.triggerRef?.focus();
          hideMenu();
        }}
      >
        Open link in incognito window
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onSelected={() => {
          (async () => {
            try {
              await navigator.clipboard.writeText(store.url!);
            } catch (e) {
              console.error("copy-link: failure", e);
              notifyError("Failed to copy the link.");
            }
          })();
          store.triggerRef?.focus();
          hideMenu();
        }}
      >
        Copy link address
      </ContextMenuItem>
    </ContextMenu>
  );
}

function usePostsContextWithDefault() {
  // the context menu is used when previewing a feed, and in that case the posts
  // context is not provided because we don't need to toggl unread.
  try {
    return usePostsContext();
  } catch {
    return { toggleUnread: undefined };
  }
}
