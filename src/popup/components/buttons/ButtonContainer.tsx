import styles from "./ButtonContainer.module.css";
import { FlowProps } from "solid-js/types/render/component";

export default function ButtonContainer(props: FlowProps) {
  return <div class={styles["button-container"]}>{props.children}</div>;
}
