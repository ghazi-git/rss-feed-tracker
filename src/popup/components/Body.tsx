import { FlowProps } from "solid-js/types/render/component";

import styles from "./Body.module.css";

export default function Body(props: FlowProps) {
  return <div class={styles.body}>{props.children}</div>;
}
