import { FlowProps } from "solid-js/types/render/component";

import styles from "./ButtonContainer.module.css";

export default function ButtonContainer(props: FlowProps) {
  return <div class={styles["button-container"]}>{props.children}</div>;
}
