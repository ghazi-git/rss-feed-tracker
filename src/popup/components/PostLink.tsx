import { A } from "@solidjs/router";
import { AnchorProps } from "@solidjs/router/dist/components";
import { splitProps } from "solid-js";

import { hideLinkPreview, showLinkPreview } from "@/popup/store/link-preview";
import { openTab, openWindow } from "@/popup/utils/urls";

import styles from "./PostLink.module.css";

export default function PostLink(props: AnchorProps) {
  const [extra, rest] = splitProps(props, ["href", "class"]);
  return (
    <A
      href={extra.href}
      class={`${styles.link} ${extra.class ?? ""}`}
      onClick={(event) => {
        event.preventDefault();
        if (event.ctrlKey) {
          openTab(extra.href);
        } else if (event.shiftKey) {
          openWindow(extra.href);
        } else {
          openTab(extra.href, true);
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          openTab(extra.href);
        }
      }}
      onMouseOver={() => showLinkPreview(extra.href)}
      onMouseOut={() => hideLinkPreview()}
      onFocus={() => showLinkPreview(extra.href)}
      onBlur={() => hideLinkPreview()}
      activeClass=""
      inactiveClass=""
      {...rest}
    />
  );
}
