import { createContext, useContext } from "solid-js";

export const DropdownContext = createContext<DropdownContextType>();

export function useDropdownContext() {
  const context = useContext(DropdownContext);

  if (!context) {
    throw new Error("useDropdownMenuContext: cannot find a DropdownContext");
  }

  return context;
}

interface DropdownContextType {
  store: DropdownStore;
  registerTriggerRef: (ref: TriggerRef) => void;
  registerMenuRef: (ref: MenuRef) => void;
  unregisterMenuRef: () => void;
  registerItem: (ref: MenuItemRef) => void;
  unregisterItem: (ref: MenuItemRef) => void;
  openMenu: () => void;
  closeMenu: () => void;
  focusItem: (pos: MenuItemPosition) => void;
  focusItemByRef: (ref: MenuItemRef) => void;
  focusTrigger: () => void;
}
export type MenuItemPosition = "first" | "last" | "next" | "previous";
export type TriggerRef = HTMLButtonElement;
export type MenuRef = HTMLDivElement;
export type MenuItemRef = HTMLDivElement;
export type MenuItemType = { ref: MenuItemRef; focused: boolean };

export interface DropdownStore {
  triggerRef: TriggerRef | null;
  triggerId: string;
  menuRef: MenuRef | null;
  menuId: string;
  open: boolean | null;
  items: MenuItemType[];
}
