import styles from "./PageHeaderWrapper.module.css";
import { FlowProps } from "solid-js/types/render/component";

export default function PageHeaderWrapper(props: FlowProps) {
  return <div class={styles["page-header-wrapper"]}>{props.children}</div>;
}
