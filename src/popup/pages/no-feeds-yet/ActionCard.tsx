import Anchor from "@/popup/components/Anchor";

import styles from "./ActionCard.module.css";
import { FlowProps } from "solid-js/types/render/component";
import { JSX } from "solid-js";

export default function ActionCard(props: FlowProps<ActionCardProps>) {
  return (
    <Anchor href={props.href} class={styles.card} onClick={props.onClick}>
      {props.children}
      <h2>{props.text}</h2>
    </Anchor>
  );
}

interface ActionCardProps {
  href: string;
  text: string;
  onClick?: JSX.EventHandler<HTMLAnchorElement, MouseEvent>;
}
