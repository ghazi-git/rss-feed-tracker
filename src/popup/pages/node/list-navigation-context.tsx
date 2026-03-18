import { useLocation } from "@solidjs/router";
import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  FlowProps,
  on,
  Setter,
  useContext,
} from "solid-js";

import { createShortcut } from "@/popup/utils/shortcuts";

const ListNavigationContext = createContext<ListNavigationContextType>();

export function ListNavigationContextProvider(
  props: ListNavigationContextProviderProps,
) {
  // track the index of the focused list item
  // null to indicate that no list item is focused
  const [focusedIndex, setFocusedIndex] = createSignal<number | null>(null);
  createShortcut("down", () => {
    if (props.listLength > 0) {
      const idx = focusedIndex();
      if (idx === null) {
        setFocusedIndex(0);
      } else {
        setFocusedIndex(Math.min(idx + 1, props.listLength - 1));
      }
    }
  });
  createShortcut("up", () => {
    const idx = focusedIndex();
    if (props.listLength > 0 && idx !== null) {
      setFocusedIndex(Math.max(idx - 1, 0));
    }
  });

  // reset the focused index on url change
  const location = useLocation();
  const url = () => location.pathname + location.search;
  createEffect(on(url, () => setFocusedIndex(null), { defer: true }));

  return (
    <ListNavigationContext.Provider value={{ focusedIndex, setFocusedIndex }}>
      {props.children}
    </ListNavigationContext.Provider>
  );
}

export function getListItemTabindex(
  focusedIndex: number | null,
  itemIndex: number,
) {
  // when no item is focused, make the first one focusable
  if (focusedIndex === null && itemIndex === 0) return 0;
  // this item is focused
  else if (focusedIndex === itemIndex) return 0;
  else return -1;
}

export function useListNavigationContext() {
  const context = useContext(ListNavigationContext);
  if (!context) {
    throw new Error(
      "useListNavigationContext: cannot find ListNavigationContext.",
    );
  }

  return context;
}

interface ListNavigationContextType {
  focusedIndex: Accessor<number | null>;
  setFocusedIndex: Setter<number | null>;
}

interface ListNavigationContextProviderProps extends FlowProps {
  listLength: number;
}
