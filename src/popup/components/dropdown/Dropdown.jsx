import { autoUpdate, computePosition, flip, offset } from "@floating-ui/dom";
import { onCleanup } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { DropdownContext } from "./context.jsx";

export default function Dropdown(props) {
  const [store, setStore] = createStore({
    triggerRef: null,
    triggerId: _generateMenuId(),
    menuRef: null,
    menuId: _generateMenuId(),
    open: null,
    items: [],
  });
  const registerTriggerRef = (ref) => setStore("triggerRef", ref);
  const registerMenuRef = (ref) => setStore("menuRef", ref);
  const unregisterMenuRef = () => setStore("menuRef", null);
  const registerItem = (ref) => {
    setStore("items", (prev) => {
      const prevCopy = [...prev];
      const index = _getInsertionIndex(ref, prev);
      prevCopy.splice(index, 0, { ref, focused: false });
      return prevCopy;
    });
  };
  const unregisterItem = (ref) => {
    setStore("items", (prev) => prev.filter((r) => r.ref !== ref));
  };

  let menuPositionCleanup;
  const _updatePosition = () => {
    computePosition(store.triggerRef, store.menuRef, {
      placement: props.placement || "bottom-start",
      middleware: [
        offset(4),
        flip(),
        accountForHeader(props.fallbackPlacement),
      ],
    }).then(({ x, y }) => {
      Object.assign(store.menuRef.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  };
  const _clickOutsideHandler = (event) => {
    if (!store.menuRef.contains(event.target)) {
      closeMenu();
    }
  };
  const openMenu = () => {
    setStore("open", true);
    menuPositionCleanup = autoUpdate(
      store.triggerRef,
      store.menuRef,
      _updatePosition,
    );
    document.addEventListener("click", _clickOutsideHandler);
  };
  const closeMenu = () => {
    setStore(
      produce((menuStore) => {
        menuStore.menuRef = null;
        menuStore.open = false;
      }),
    );
    if (menuPositionCleanup) {
      menuPositionCleanup();
    }
    document.removeEventListener("click", _clickOutsideHandler);
  };
  const _focusItem = (index) => {
    const currentIndex = _getCurrentlyFocusedIndex(store.items);
    if (currentIndex >= 0) {
      setStore("items", currentIndex, "focused", false);
    }
    setStore("items", index, "focused", true);
    store.items.at(index).ref.focus();
  };
  const focusItem = (item) => {
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
  const focusItemByRef = (ref) => {
    const idx = store.items.findIndex((r) => r.ref === ref);
    if (idx >= 0) {
      _focusItem(idx);
    }
  };
  const focusTrigger = () => store.triggerRef.focus();
  onCleanup(() => {
    closeMenu();
  });

  return (
    <DropdownContext.Provider
      value={{
        store,
        registerTriggerRef,
        registerMenuRef,
        unregisterMenuRef,
        registerItem,
        unregisterItem,
        openMenu,
        closeMenu,
        focusItem,
        focusItemByRef,
        focusTrigger,
      }}
    >
      {props.children}
    </DropdownContext.Provider>
  );
}

function _getInsertionIndex(elt, refs) {
  if (refs.length === 0) return 0;

  // The dropdown keep references to all DOM elements of menu items. So, when
  // a new menu item component is added to the DOM we need to figure out where
  // to put it in the reference list
  for (const [index, r] of refs.entries()) {
    if (r.ref.compareDocumentPosition(elt) & Node.DOCUMENT_POSITION_PRECEDING) {
      return index;
    }
  }
  return refs.length;
}

function _getCurrentlyFocusedIndex(items) {
  return items.findIndex((r) => r.focused);
}

function _generateMenuId() {
  const uuid = crypto.randomUUID();
  return `menu-${uuid.slice(0, 8)}`;
}

/**
 * By default, the placement of the dropdown menu does not account for
 * the header. So, there are cases when the first items in the menu will
 * be hidden by the header. This is where this middleware helps provide
 * a fallback placement for the dropdown to avoid the issue.
 *
 * The middleware was added mainly to avoid the dropdown menu of a FolderChild
 * being hidden by the header. This happens when the flip middleware displays
 * the menu to the top since there is no space left at the bottom.
 */
function accountForHeader(fallbackPlacement) {
  return {
    name: "accountForHeader",
    fn(state) {
      if (fallbackPlacement) {
        const headerSize = getComputedStyle(
          document.documentElement,
        ).getPropertyValue("--header-size");
        // header size + a bit of leeway
        const threshold = parseInt(headerSize) + 16;
        if (state.y <= threshold && state.rects.reference.y > threshold) {
          return { reset: { placement: fallbackPlacement } };
        }
      }

      return {};
    },
  };
}
