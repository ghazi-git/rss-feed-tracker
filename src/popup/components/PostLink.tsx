import { A, AnchorProps } from "@solidjs/router";
import { onCleanup, splitProps } from "solid-js";

import { hideLinkPreview, showLinkPreview } from "@/popup/utils/link-preview";

import styles from "./PostLink.module.css";

export default function PostLink(props: AnchorProps) {
  const [extra, rest] = splitProps(props, ["href", "class"]);
  onCleanup(() => hideLinkPreview(extra.href));

  return (
    <A
      href={extra.href}
      class={`${styles.link} ${extra.class ?? ""}`}
      onMouseOver={() => showLinkPreview(extra.href)}
      onMouseOut={() => hideLinkPreview(extra.href)}
      onFocus={() => showLinkPreview(extra.href)}
      onBlur={() => hideLinkPreview(extra.href)}
      activeClass=""
      inactiveClass=""
      {...rest}
    />
  );
}
