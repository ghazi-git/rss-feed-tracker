import { batch, createEffect, JSX, splitProps, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";

import {
  ContextMenuContext,
  ContextMenuItemPosition,
  ContextMenuItemRef,
} from "@/popup/components/context-menu/context";

import styles from "./ContextMenu.module.css";

export default function ContextMenu(props: ContextMenuProps) {
  let menuRef: HTMLDivElement;
  const [extra, rest] = splitProps(props, [
    "top",
    "left",
    "closeContextMenu",
    "ref",
    "class",
    "shown",
    "focusFirstItem",
  ]);
  const [store, setStore] = createStore<{ items: ContextMenuItemType[] }>({
    items: [],
  });

  const registerItem = (ref: ContextMenuItemRef) => {
    setStore("items", (prev) => {
      const prevCopy = [...prev];
      const index = _getInsertionIndex(ref, prev);
      prevCopy.splice(index, 0, { ref, focused: false });
      return prevCopy;
    });
  };
  const unregisterItem = (ref: ContextMenuItemRef) => {
    setStore("items", (prev) => prev.filter((r) => r.ref !== ref));
  };

  const _focusItem = (index: number) => {
    const currentIndex = _getCurrentlyFocusedIndex(store.items);
    batch(() => {
      if (currentIndex >= 0) {
        setStore("items", currentIndex, "focused", false);
      }
      setStore("items", index, "focused", true);
    });
    store.items.at(index)?.ref.focus();
  };
  const focusItem = (item: ContextMenuItemPosition) => {
    if (item === "first") {
      _focusItem(0);
    } else if (item === "last") {
      _focusItem(store.items.length - 1);
    } else if (item === "next") {
      const currentIndex = _getCurrentlyFocusedIndex(store.items);
      if (currentIndex >= 0) {
        const nextIndex = (currentIndex + 1) % store.items.length;
        _focusItem(nextIndex);
      }
    } else if (item === "previous") {
      const currentIndex = _getCurrentlyFocusedIndex(store.items);
      if (currentIndex >= 0) {
        const prevIdx =
          (store.items.length + currentIndex - 1) % store.items.length;
        _focusItem(prevIdx);
      }
    }
  };
  const focusItemByRef = (ref: ContextMenuItemRef) => {
    const idx = store.items.findIndex((r) => r.ref === ref);
    if (idx >= 0) {
      _focusItem(idx);
    }
  };

  const _closeMenu = () => {
    extra.closeContextMenu();
    setStore(
      "items",
      { from: 0, to: store.items.length - 1 },
      "focused",
      false,
    );
  };
  const _clickOutsideHandler = (event: MouseEvent) => {
    if (!menuRef.contains(event.target as Node)) {
      _closeMenu();
    }
  };
  const _scrollHandler = () => _closeMenu();
  createEffect(() => {
    if (extra.shown) {
      document.addEventListener("mousedown", _clickOutsideHandler, true);
      document.addEventListener("scroll", _scrollHandler, true);
    } else {
      document.removeEventListener("mousedown", _clickOutsideHandler, true);
      document.removeEventListener("scroll", _scrollHandler, true);
    }
  });
  createEffect(() => {
    if (extra.focusFirstItem) {
      // don't track store.items that is accessed in focusItem
      untrack(() => {
        focusItem("first");
      });
    }
  });

  return (
    <ContextMenuContext.Provider
      value={{
        registerItem,
        unregisterItem,
        focusItemByRef,
      }}
    >
      <Portal>
        <div
          ref={(elt) => {
            menuRef = elt;
            if (typeof extra.ref === "function") {
              extra.ref(elt);
            } else if (extra.ref) {
              throw new Error("ref passed to ContextMenu should be a function");
            }
          }}
          class={`${styles["context-menu"]} ${extra.class ?? ""}`}
          classList={{ [styles.hidden]: !extra.shown }}
          inert={!extra.shown}
          style={{ top: `${extra.top}px`, left: `${extra.left}px` }}
          role="menu"
          onKeyDown={(event) => {
            // todo test tab and escape
            if (event.key === "Tab") {
              extra.closeContextMenu();
              // focusTrigger();
              if (event.shiftKey) {
                // so that focus stays on the trigger
                event.preventDefault();
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              extra.closeContextMenu();
              // focusTrigger();
            } else if (event.key === "ArrowDown") {
              focusItem("next");
            } else if (event.key === "ArrowUp") {
              focusItem("previous");
            } else if (event.key === "Home" || event.key === "PageUp") {
              focusItem("first");
            } else if (event.key === "End" || event.key === "PageDown") {
              focusItem("last");
            }
          }}
          {...rest}
        />
      </Portal>
    </ContextMenuContext.Provider>
  );
}

function _getInsertionIndex(
  elt: ContextMenuItemRef,
  refs: ContextMenuItemType[],
) {
  if (refs.length === 0) return 0;

  // The context menu keep references to all DOM elements of menu items. So,
  // when a new context menu item component is added to the DOM, we need to
  // figure out where to put it in the reference list
  for (const [index, r] of refs.entries()) {
    if (r.ref.compareDocumentPosition(elt) & Node.DOCUMENT_POSITION_PRECEDING) {
      return index;
    }
  }
  return refs.length;
}

function _getCurrentlyFocusedIndex(items: ContextMenuItemType[]) {
  return items.findIndex((r) => r.focused);
}

interface ContextMenuProps extends JSX.HTMLAttributes<HTMLDivElement> {
  shown: boolean;
  left: number;
  top: number;
  closeContextMenu: () => void;
  focusFirstItem: boolean;
}

interface ContextMenuItemType {
  ref: ContextMenuItemRef;
  focused: boolean;
}
