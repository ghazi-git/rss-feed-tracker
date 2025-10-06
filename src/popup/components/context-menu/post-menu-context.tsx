import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const PostMenuContext = createContext<PostMenuContextType>();

export function usePostMenuContext() {
  const context = useContext(PostMenuContext);
  if (!context) {
    throw new Error("usePostMenuContext: cannot find a PostMenuContext");
  }

  return context;
}

export function PostMenuProvider(props: FlowProps) {
  const [store, setStore] = createStore<PostMenuStore>({
    shown: false,
    menuRef: null,
    triggerRef: null,
    url: null,
    focusFirstItem: false,
    guid: null,
    position: { top: 0, left: 0 },
  });
  const registerMenuRef = (ref: HTMLDivElement) => setStore("menuRef", ref);
  const showMenu = (
    triggerRef: HTMLElement,
    url: string,
    top: number,
    left: number,
    focusFirstItem: boolean,
    guid: string | null = null,
  ) => {
    setStore(({ menuRef }) => ({
      shown: true,
      menuRef,
      triggerRef,
      url,
      focusFirstItem,
      guid,
      position: { top, left },
    }));
  };
  const hideMenu = () => {
    setStore(({ menuRef }) => ({
      shown: false,
      menuRef,
      triggerRef: null,
      url: null,
      focusFirstItem: false,
      guid: null,
      position: { top: 0, left: 0 },
    }));
  };

  return (
    <PostMenuContext.Provider
      value={{ store, showMenu, hideMenu, registerMenuRef }}
    >
      {props.children}
    </PostMenuContext.Provider>
  );
}

interface PostMenuContextType {
  store: PostMenuStore;
  registerMenuRef: (ref: HTMLDivElement) => void;
  showMenu: (
    triggerRef: HTMLElement,
    url: string,
    top: number,
    left: number,
    focusFirstItem: boolean,
    guid?: string | null,
  ) => void;
  hideMenu: () => void;
}

type PostMenuStore =
  | {
      shown: false;
      menuRef: HTMLDivElement | null;
      triggerRef: null;
      url: null;
      focusFirstItem: false;
      guid: null;
      position: { top: 0; left: 0 };
    }
  | {
      shown: true;
      menuRef: HTMLDivElement | null;
      triggerRef: HTMLElement | null;
      url: string;
      focusFirstItem: boolean;
      guid: string | null;
      position: { top: number; left: number };
    };
