import { createContext, FlowProps, useContext } from "solid-js";

import {
  saveLastVisitedPage,
  useCurrentURL,
} from "@/popup/utils/last-visited-page";

import styles from "./Body.module.css";

export default function Body(props: FlowProps) {
  let ref!: HTMLDivElement;
  const currentURL = useCurrentURL();

  const setScrollPosition = (pos: number) => (ref.scrollTop = pos);

  return (
    <BodyContext.Provider value={{ setScrollPosition }}>
      <div
        ref={ref}
        class={styles.body}
        onScrollEnd={(event) => {
          saveLastVisitedPage(currentURL(), event.target.scrollTop);
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
}
