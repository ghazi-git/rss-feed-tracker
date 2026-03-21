import { useSearchParams } from "@solidjs/router";
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
    focusedItem?: string;
    keyboardNav?: string;
  }>();
  const focusedItemFromSearchParams = () => {
    const id = searchParams.focusedItem;
    if (id && props.items.includes(id)) return id;

    if (searchParams.keyboardNav === "true" && props.items.length > 0) {
      return props.items[0];
    }

    return null;
  };
  // track the id of the focused list item
  // null to indicate that no list item is focused
  const [focusedItem, setFocusedItem] = createSignal<string | null>(
    focusedItemFromSearchParams(),
  );
  // save the focused item in search params so that we can retrieve it
  // if the popup closes accidentally
  createEffect(() => {
    setSearchParams({ focusedItem: focusedItem() }, { replace: true });
  });
  createShortcut("down", () => {
    if (props.items.length > 0) {
      const item = focusedItem();
      if (item === null) {
        setFocusedItem(props.items[0]);
      } else {
        const idx = props.items.indexOf(item);
        // focus the first item if the id is not found
        const next = Math.min(idx + 1, props.items.length - 1);
        setFocusedItem(props.items[next]);
      }
    }
  });
  createShortcut("up", () => {
    const item = focusedItem();
    if (props.items.length > 0 && item !== null) {
      const idx = props.items.indexOf(item);
      if (idx >= 0) {
        const prev = Math.max(idx - 1, 0);
        setFocusedItem(props.items[prev]);
      }
    }
  });
  const resetFocusedItem = () => {
    const item = focusedItemFromSearchParams();
    setFocusedItem(item);
  };

  // reset the focused index when the reset prop changes
  createEffect(
    on(
      () => props.reset,
      () => resetFocusedItem(),
      { defer: true },
    ),
  );

  return (
    <ListNavigationContext.Provider
      value={{ focusedItem, setFocusedItem, resetFocusedItem }}
    >
      {props.children}
    </ListNavigationContext.Provider>
  );
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
  focusedItem: Accessor<string | null>;
  setFocusedItem: Setter<string | null>;
  resetFocusedItem: () => void;
}

interface ListNavigationContextProviderProps extends FlowProps {
  items: string[];
  reset?: number;
}
