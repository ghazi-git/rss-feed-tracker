import { A } from "@solidjs/router";
import { AnchorProps } from "@solidjs/router/dist/components";
import { JSX, splitProps } from "solid-js";

import styles from "./Anchor.module.css";

/**
 * The main idea for this Anchor tag is to enable only left click. Other ways
 * of opening links (right-click, middle click, shift/ctrl+click) do not make
 * sense in a browser extension popup. So, they are disabled.
 */
export default function Anchor(props: AnchorTagProps) {
  const [extra, rest] = splitProps(props, ["class", "onClick"]);
  return (
    <A
      class={`${styles.anchor} ${extra.class ?? ""}`}
      draggable="false"
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.metaKey
        ) {
          if (extra.onClick) {
            extra.onClick(event);
          }
          return;
        }
        event.preventDefault();
      }}
      onContextMenu={(event) => event.preventDefault()}
      onAuxClick={(event) => event.preventDefault()}
      activeClass=""
      inactiveClass=""
      {...rest}
    />
  );
}

interface AnchorTagProps extends AnchorProps {
  onClick?: JSX.EventHandler<HTMLAnchorElement, MouseEvent>;
}
