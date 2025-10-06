import { A, AnchorProps } from "@solidjs/router";
import { splitProps } from "solid-js";

import { hideLinkPreview, showLinkPreview } from "@/popup/store/link-preview";

import styles from "./PostLink.module.css";

export default function PostLink(props: AnchorProps) {
  const [extra, rest] = splitProps(props, ["href", "class"]);
  return (
    <A
      href={extra.href}
      class={`${styles.link} ${extra.class ?? ""}`}
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
