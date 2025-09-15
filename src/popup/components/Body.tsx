import styles from "./Body.module.css";
import { FlowProps } from "solid-js/types/render/component";

export default function Body(props: FlowProps) {
  return <div class={styles.body}>{props.children}</div>;
}
