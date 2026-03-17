import { useNavigate } from "@solidjs/router";

import Anchor from "@/popup/components/Anchor";
import PreviousIcon from "@/popup/components/svg-icons/PreviousIcon";
import { createShortcut } from "@/popup/utils/shortcuts";

import styles from "./BackLink.module.css";

export default function BackLink(props: BackLinkProps) {
  const navigate = useNavigate();
  createShortcut("backspace", () => navigate(props.url));

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
