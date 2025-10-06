import { FlowProps } from "solid-js";

import styles from "./Body.module.css";

export default function Body(props: FlowProps) {
  return <div class={styles.body}>{props.children}</div>;
}
