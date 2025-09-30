import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { FlowProps } from "solid-js/types/render/component";

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
    url: null,
    guid: null,
    position: { top: 0, left: 0 },
  });
  const registerMenuRef = (ref: HTMLDivElement) => setStore("menuRef", ref);
  const showMenu = (
    url: string,
    top: number,
    left: number,
    guid: string | null = null,
  ) => {
    setStore(({ menuRef }) => ({
      shown: true,
      menuRef,
      url,
      guid,
      position: { top, left },
    }));
  };
  const hideMenu = () => {
    setStore(({ menuRef }) => ({
      shown: false,
      menuRef,
      url: null,
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
    url: string,
    top: number,
    left: number,
    guid?: string | null,
  ) => void;
  hideMenu: () => void;
}

type PostMenuStore =
  | {
      shown: false;
      menuRef: HTMLDivElement | null;
      url: null;
      guid: null;
      position: { top: 0; left: 0 };
    }
  | {
      shown: true;
      menuRef: HTMLDivElement | null;
      url: string;
      guid: string | null;
      position: { top: number; left: number };
    };
