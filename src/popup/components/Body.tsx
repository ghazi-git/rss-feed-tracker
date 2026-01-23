import { createContext, FlowProps, useContext } from "solid-js";

import {
  saveLastVisitedPage,
  useCurrentURL,
} from "@/popup/utils/last-visited-page";

import styles from "./Body.module.css";

export default function Body(props: FlowProps) {
  let ref!: HTMLDivElement;
  let postsCountCallback: PostsCountCallback | undefined;
  const currentURL = useCurrentURL();

  const setScrollPosition = (pos: number) => (ref.scrollTop = pos);
  const registerPostsCountCallback = (callback: PostsCountCallback) => {
    postsCountCallback = callback;
  };
  const removePostsCountCallback = () => {
    postsCountCallback = undefined;
  };

  return (
    <BodyContext.Provider
      value={{
        setScrollPosition,
        registerPostsCountCallback,
        removePostsCountCallback,
      }}
    >
      <div
        ref={ref}
        class={styles.body}
        onScrollEnd={(event) => {
          const postsCount = postsCountCallback?.() ?? null;
          saveLastVisitedPage(currentURL(), event.target.scrollTop, postsCount);
        }}
      >
        {props.children}
      </div>
    </BodyContext.Provider>
  );
}

const BodyContext = createContext<BodyContextType>();

export function useBodyContext() {
  const context = useContext(BodyContext);
  if (!context) {
    throw new Error("useBodyContext: cannot find BodyContext");
  }

  return context;
}

interface BodyContextType {
  setScrollPosition: (position: number) => void;
  registerPostsCountCallback: (callback: PostsCountCallback) => void;
  removePostsCountCallback: () => void;
}

type PostsCountCallback = () => number;
