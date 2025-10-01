import { showToast } from "solid-notifications";

import ContextMenu from "@/popup/components/context-menu/ContextMenu";
import ContextMenuItem from "@/popup/components/context-menu/ContextMenuItem";
import ContextMenuSeparator from "@/popup/components/context-menu/ContextMenuSeparator";
import { usePostMenuContext } from "@/popup/components/context-menu/post-menu-context";
import { openTab, openWindow } from "@/popup/utils/urls";

export function PostContextMenu(props: PostContextMenuProps) {
  const { store, registerMenuRef, hideMenu } = usePostMenuContext();

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
        hideMenu();
      }}
      aria-label="Post Options"
    >
      <ContextMenuItem
        onSelected={() => {
          if (props.onLinkOpened && store.guid) {
            props.onLinkOpened(store.guid);
          }
          openTab(store.url!);
          hideMenu();
        }}
      >
        Open link in new tab
      </ContextMenuItem>
      <ContextMenuItem
        onSelected={() => {
          if (props.onLinkOpened && store.guid) {
            props.onLinkOpened(store.guid);
          }
          openWindow(store.url!);
          hideMenu();
        }}
      >
        Open link in new window
      </ContextMenuItem>
      <ContextMenuItem
        onSelected={() => {
          if (props.onLinkOpened && store.guid) {
            props.onLinkOpened(store.guid);
          }
          openWindow(store.url!, true);
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
            } catch {
              showToast("Failed to copy the link.");
            }
          })();
          hideMenu();
        }}
      >
        Copy link address
      </ContextMenuItem>
    </ContextMenu>
  );
}

type PostContextMenuProps = {
  onLinkOpened?: (guid: string) => void;
};
