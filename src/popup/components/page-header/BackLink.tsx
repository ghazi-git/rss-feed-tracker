import Anchor from "@/popup/components/Anchor";
import PreviousIcon from "@/popup/components/svg-icons/PreviousIcon";

import styles from "./BackLink.module.css";

export default function BackLink(props: BackLinkProps) {
  return (
    <Anchor
      href={props.url}
      class={`${styles["back-link"]} ${props.class ?? ""}`}
    >
      <PreviousIcon />
    </Anchor>
  );
}

interface BackLinkProps {
  url: string;
  class?: string;
}
