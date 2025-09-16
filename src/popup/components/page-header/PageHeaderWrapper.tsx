import { FlowProps } from "solid-js/types/render/component";

import styles from "./PageHeaderWrapper.module.css";

export default function PageHeaderWrapper(props: FlowProps) {
  return <div class={styles["page-header-wrapper"]}>{props.children}</div>;
}
