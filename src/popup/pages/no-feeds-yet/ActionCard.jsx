import Anchor from "@/popup/components/Anchor";

import styles from "./ActionCard.module.css";

export default function ActionCard(props) {
  return (
    <Anchor href={props.href} class={styles.card} onClick={props.onClick}>
      {props.children}
      <h2>{props.text}</h2>
    </Anchor>
  );
}
