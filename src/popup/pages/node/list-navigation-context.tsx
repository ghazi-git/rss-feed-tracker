import { useLocation, useSearchParams } from "@solidjs/router";
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
  const [searchParams, setSearchParams] = useSearchParams<{
    focusedIndex?: string;
  }>();
  // track the index of the focused list item
  // null to indicate that no list item is focused
  const idx = getFocusedIndexFromSearchParams(searchParams.focusedIndex);
  const [focusedIndex, setFocusedIndex] = createSignal<number | null>(idx);
  // save the focused index in search params so that we can retrieve it
  // if the popup closes accidentally
  createEffect(
    on(
      focusedIndex,
      (focusedIndex) => setSearchParams({ focusedIndex }, { replace: true }),
      { defer: true },
    ),
  );
  createShortcut("down", () => {
    if (props.items.length > 0) {
      const idx = focusedIndex();
      if (idx === null) {
        setFocusedIndex(0);
      } else {
        setFocusedIndex(Math.min(idx + 1, props.items.length - 1));
      }
    }
  });
  createShortcut("up", () => {
    const idx = focusedIndex();
    if (props.items.length > 0 && idx !== null) {
      setFocusedIndex(Math.max(idx - 1, 0));
    }
  });
  const resetFocusedIndex = () => {
    const idx = getFocusedIndexFromSearchParams(searchParams.focusedIndex);
    setFocusedIndex(idx);
  };

  // reset the focused index on url change
  const location = useLocation();
  const url = () => location.pathname;
  createEffect(on(url, () => resetFocusedIndex(), { defer: true }));

  return (
    <ListNavigationContext.Provider
      value={{ focusedIndex, setFocusedIndex, resetFocusedIndex }}
    >
      {props.children}
    </ListNavigationContext.Provider>
  );
}

function getFocusedIndexFromSearchParams(idx?: string) {
  if (!idx) return null;

  const index = parseInt(idx);
  return !isNaN(index) && index >= 0 ? index : null;
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
  resetFocusedIndex: () => void;
}

interface ListNavigationContextProviderProps extends FlowProps {
  items: string[];
}
